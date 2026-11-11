"""
EvalForge: An LLM Evaluation & Benchmarking Tool.

This script executes the same set of evaluation prompts against two frontier LLMs:
1. Google Gemini (gemini-1.5-flash)
2. Llama 3.1 on Groq (llama-3.1-8b-instant)

Each candidate answer is evaluated by an LLM Judge (Gemini) against reference ground truth
using a strict rubric across three dimensions:
- Accuracy (1 to 5)
- Reasoning (1 to 5)
- Clarity (1 to 5)
Plus a concise one-line reason.

Results are compiled into a pandas DataFrame, exported to `results.csv`,
and presented in an ASCII summary table declaring the empirical winner.
"""

import argparse  # Used to parse command-line arguments for single-prompt or batch mode
import json  # Used for reading prompts.json and parsing judge outputs
import os  # Used to access environment variables
import re  # Used to extract strict JSON blocks from raw LLM responses
import sys  # Used for exit codes and standard error messaging
import time  # Used for backoff retries when parsing or calling APIs
from typing import Any, Dict, List, Optional, Tuple  # Type hints for maintainability

from dotenv import load_dotenv  # Loads environment variables from .env file
import google.generativeai as genai  # Official Google Gemini SDK
from groq import Groq  # Official Groq Cloud SDK
import pandas as pd  # Data manipulation, aggregation, and CSV export


# ==============================================================================
# 1. ENVIRONMENT & CLIENT INITIALIZATION
# ==============================================================================

def load_environment() -> Tuple[str, str]:
    """
    Loads API keys from the local .env file and validates their presence.

    Returns:
        Tuple[str, str]: (gemini_api_key, groq_api_key)

    Raises:
        SystemExit: If either key is missing from the environment.
    """
    # Load .env file from the current working directory
    load_dotenv()

    # Retrieve the Gemini API key from the environment
    gemini_key: Optional[str] = os.getenv("GEMINI_API_KEY")

    # Retrieve the Groq API key from the environment
    groq_key: Optional[str] = os.getenv("GROQ_API_KEY")

    # Validate that both keys exist before proceeding
    if not gemini_key or not groq_key:
        print("[ERROR] Missing required API keys in .env file!")
        print("Please ensure both GEMINI_API_KEY and GROQ_API_KEY are configured.")
        print("Reference .env.example for the expected format.")
        sys.exit(1)

    # Return the validated API keys
    return gemini_key, groq_key


def init_gemini_client(api_key: str) -> genai.GenerativeModel:
    """
    Initializes the Google Generative AI client with the provided API key.

    Args:
        api_key (str): The Google AI Studio Gemini API key.

    Returns:
        genai.GenerativeModel: Configured Gemini 1.5 Flash model instance.
    """
    # Configure the global Google Generative AI library with the key
    genai.configure(api_key=api_key)

    # Instantiate the fast and accurate Gemini 1.5 Flash model
    return genai.GenerativeModel("gemini-1.5-flash")


def init_groq_client(api_key: str) -> Groq:
    """
    Initializes the Groq client for fast Llama inference.

    Args:
        api_key (str): The Groq Cloud API key.

    Returns:
        Groq: Configured Groq client instance.
    """
    # Initialize and return the Groq client object
    return Groq(api_key=api_key)


# ==============================================================================
# 2. DATA INTAKE & DATASET LOADING
# ==============================================================================

def load_prompts_file(filepath: str = "prompts.json") -> List[Dict[str, Any]]:
    """
    Reads and validates benchmark test items from a JSON file.

    Args:
        filepath (str): Path to prompts.json. Defaults to 'prompts.json'.

    Returns:
        List[Dict[str, Any]]: List of prompt dictionaries containing id, prompt, and reference_answer.
    """
    # Verify that the target file exists on disk
    if not os.path.exists(filepath):
        print(f"[ERROR] The dataset file '{filepath}' was not found.")
        sys.exit(1)

    # Open and parse the JSON file safely
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure the loaded data is a list
            if not isinstance(data, list):
                raise ValueError("prompts.json must contain a JSON array of items.")
            return data
    except Exception as e:
        print(f"[ERROR] Failed to read or parse '{filepath}': {e}")
        sys.exit(1)


# ==============================================================================
# 3. CANDIDATE MODEL INFERENCE
# ==============================================================================

def call_gemini(model: genai.GenerativeModel, prompt_text: str) -> str:
    """
    Sends a prompt to Google Gemini 1.5 Flash and returns the generated text.

    Args:
        model (genai.GenerativeModel): Configured Gemini model.
        prompt_text (str): The input user prompt.

    Returns:
        str: Model's answer text, or an error description.
    """
    try:
        # Generate content with standard temperature and safety settings
        response = model.generate_content(prompt_text)
        # Extract and return the stripped text response
        return response.text.strip() if response.text else "[No response generated]"
    except Exception as error:
        # Gracefully capture and format any API or network exceptions
        return f"[Gemini Error: {str(error)}]"


def call_llama_groq(client: Groq, prompt_text: str) -> str:
    """
    Sends a prompt to Llama 3.1 8B Instant on Groq and returns the generated text.

    Args:
        client (Groq): Configured Groq client.
        prompt_text (str): The input user prompt.

    Returns:
        str: Model's answer text, or an error description.
    """
    try:
        # Create a chat completion with Llama 3.1 8B Instant
        chat_completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt_text}],
            temperature=0.3,  # Controlled temperature for consistent benchmarking
            max_tokens=1024,  # Ample response token budget
        )
        # Extract the assistant's message content
        return chat_completion.choices[0].message.content.strip()
    except Exception as error:
        # Gracefully capture and format any Groq API exceptions
        return f"[Groq Llama Error: {str(error)}]"


# ==============================================================================
# 4. LLM JUDGE WITH STRICT JSON RETRY MECHANISM
# ==============================================================================

def extract_json_safely(raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Extracts a JSON object from raw LLM text using regex pattern matching.

    Args:
        raw_text (str): Raw string output from the judge model.

    Returns:
        Optional[Dict[str, Any]]: Parsed dictionary if valid JSON, else None.
    """
    # Search for text enclosed between the first '{' and the last '}'
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        return None

    json_str = match.group(0).strip()
    try:
        # Attempt standard JSON decoding
        parsed = json.loads(json_str)
        # Verify that all 4 required keys exist
        required_keys = {"accuracy", "reasoning", "clarity", "reason"}
        if required_keys.issubset(parsed.keys()):
            # Enforce integer clamping between 1 and 5 for numerical scores
            parsed["accuracy"] = max(1, min(5, int(parsed["accuracy"])))
            parsed["reasoning"] = max(1, min(5, int(parsed["reasoning"])))
            parsed["clarity"] = max(1, min(5, int(parsed["clarity"])))
            parsed["reason"] = str(parsed["reason"]).strip()
            return parsed
        return None
    except Exception:
        # Return None if parsing fails
        return None


def judge_answer(
    judge_model: genai.GenerativeModel,
    prompt_text: str,
    reference_answer: str,
    candidate_answer: str,
    max_retries: int = 2,
) -> Dict[str, Any]:
    """
    Scores a candidate model's answer against the reference ground truth using Gemini as Judge.
    Handles invalid JSON safely with up to `max_retries` retries.

    Args:
        judge_model (genai.GenerativeModel): Configured Gemini model acting as Judge.
        prompt_text (str): The original question asked.
        reference_answer (str): The ground truth answer.
        candidate_answer (str): The candidate LLM's response to evaluate.
        max_retries (int): Maximum retry attempts if invalid JSON is received.

    Returns:
        Dict[str, Any]: Dictionary containing accuracy, reasoning, clarity, and reason.
    """
    # Construct the rigorous evaluation rubric prompt
    rubric_prompt = f"""
You are an expert impartial AI evaluation judge.
Evaluate the candidate answer against the provided question and reference answer.

[QUESTION]:
{prompt_text}

[REFERENCE ANSWER (Ground Truth)]:
{reference_answer}

[CANDIDATE ANSWER TO EVALUATE]:
{candidate_answer}

Evaluation Rubric:
1. accuracy (1 to 5): Factual correctness compared to the reference answer. (5 = perfectly accurate, 1 = completely incorrect/hallucinated).
2. reasoning (1 to 5): Logical soundness, step-by-step coherence, and depth of explanation. (5 = rock solid logic, 1 = flawed or circular).
3. clarity (1 to 5): Readability, directness, and structure. (5 = exceptionally clear, 1 = confusing or poorly written).
4. reason: A single concise sentence explaining your scores.

IMPORTANT INSTRUCTIONS:
- You must output ONLY a valid JSON object.
- Do NOT use markdown code blocks or any conversational text before or after the JSON.
- Example valid JSON:
{{"accuracy": 5, "reasoning": 4, "clarity": 5, "reason": "Correct factual points and clean structure matching the reference."}}
"""

    for attempt in range(max_retries + 1):
        try:
            # Query the judge model
            response = judge_model.generate_content(rubric_prompt)
            raw_output = response.text if response.text else ""

            # Attempt to parse strict JSON from the judge's response
            parsed_scores = extract_json_safely(raw_output)
            if parsed_scores is not None:
                return parsed_scores

            # If parsing failed and retries remain, wait briefly before retrying
            print(f"  [WARN] Invalid JSON received from judge on attempt {attempt + 1}. Retrying...")
            time.sleep(1)

        except Exception as judge_err:
            print(f"  [WARN] Judge API error on attempt {attempt + 1}: {judge_err}")
            time.sleep(1)

    # Safe fallback if all retry attempts fail
    return {
        "accuracy": 1,
        "reasoning": 1,
        "clarity": 1,
        "reason": "Evaluation failed: Judge output could not be parsed into valid JSON.",
    }


# ==============================================================================
# 5. METRICS COMPUTATION & BENCHMARK RUNNER
# ==============================================================================

def calculate_accuracy_percentage(avg_accuracy_score: float) -> float:
    """
    Converts average accuracy score (scale 1 to 5) into a percentage.
    Formula: (average_accuracy_score / 5.0) * 100.0

    Args:
        avg_accuracy_score (float): Mean accuracy score between 1.0 and 5.0.

    Returns:
        float: Scaled accuracy percentage (0.0% to 100.0%).
    """
    # Divide the mean score by the maximum scale (5) and multiply by 100
    return round((avg_accuracy_score / 5.0) * 100.0, 2)


def run_benchmark(
    items: List[Dict[str, Any]],
    gemini_model: genai.GenerativeModel,
    groq_client: Groq,
) -> pd.DataFrame:
    """
    Executes the evaluation pipeline across all test items.

    Args:
        items (List[Dict[str, Any]]): List of test item dictionaries.
        gemini_model (genai.GenerativeModel): Configured Gemini candidate & judge model.
        groq_client (Groq): Configured Groq client for Llama.

    Returns:
        pd.DataFrame: Complete tabular results including candidate answers and judge scores.
    """
    results: List[Dict[str, Any]] = []  # Collector for row-level evaluation records
    total_items = len(items)

    print(f"\n🚀 Starting EvalForge Benchmark on {total_items} prompt(s)...\n")

    # Iterate through every prompt in the dataset
    for index, item in enumerate(items, start=1):
        item_id = item.get("id", index)
        prompt = item.get("prompt", "")
        reference = item.get("reference_answer", "")

        print(f"[{index}/{total_items}] Evaluating Prompt ID #{item_id}: {prompt[:60]}...")

        # Step 1: Call Candidate Model A (Google Gemini 1.5 Flash)
        gemini_ans = call_gemini(gemini_model, prompt)

        # Step 2: Call Candidate Model B (Llama 3.1 8B Instant on Groq)
        llama_ans = call_llama_groq(groq_client, prompt)

        # Step 3: Judge Candidate Model A's answer
        gemini_scores = judge_answer(gemini_model, prompt, reference, gemini_ans)

        # Step 4: Judge Candidate Model B's answer
        llama_scores = judge_answer(gemini_model, prompt, reference, llama_ans)

        # Append consolidated row record
        results.append({
            "id": item_id,
            "category": item.get("category", "General"),
            "prompt": prompt,
            "reference_answer": reference,
            # Candidate A Outputs & Scores
            "gemini_answer": gemini_ans,
            "gemini_accuracy": gemini_scores["accuracy"],
            "gemini_reasoning": gemini_scores["reasoning"],
            "gemini_clarity": gemini_scores["clarity"],
            "gemini_judge_reason": gemini_scores["reason"],
            # Candidate B Outputs & Scores
            "llama_answer": llama_ans,
            "llama_accuracy": llama_scores["accuracy"],
            "llama_reasoning": llama_scores["reasoning"],
            "llama_clarity": llama_scores["clarity"],
            "llama_judge_reason": llama_scores["reason"],
        })

    # Return as structured pandas DataFrame
    return pd.DataFrame(results)


# ==============================================================================
# 6. REPORTING, WINNER DECLARATION & CSV EXPORT
# ==============================================================================

def display_summary_table(df: pd.DataFrame) -> str:
    """
    Computes statistical averages, declares the empirical winner,
    and prints a clean ASCII summary table to stdout.

    Args:
        df (pd.DataFrame): The populated results DataFrame.

    Returns:
        str: Name of the winning model ("Google Gemini", "Llama 3.1 (Groq)", or "Tie").
    """
    # Compute mean metrics for Gemini
    gemini_avg_acc = float(df["gemini_accuracy"].mean())
    gemini_avg_reas = float(df["gemini_reasoning"].mean())
    gemini_avg_clar = float(df["gemini_clarity"].mean())
    gemini_acc_pct = calculate_accuracy_percentage(gemini_avg_acc)

    # Compute mean metrics for Llama on Groq
    llama_avg_acc = float(df["llama_accuracy"].mean())
    llama_avg_reas = float(df["llama_reasoning"].mean())
    llama_avg_clar = float(df["llama_clarity"].mean())
    llama_acc_pct = calculate_accuracy_percentage(llama_avg_acc)

    # Determine the winner based on composite score (Accuracy weighted 50%, Reasoning 30%, Clarity 20%)
    gemini_composite = (gemini_avg_acc * 0.5) + (gemini_avg_reas * 0.3) + (gemini_avg_clar * 0.2)
    llama_composite = (llama_avg_acc * 0.5) + (llama_avg_reas * 0.3) + (llama_avg_clar * 0.2)

    if gemini_composite > llama_composite:
        winner = "Google Gemini (gemini-1.5-flash)"
    elif llama_composite > gemini_composite:
        winner = "Llama 3.1 on Groq (llama-3.1-8b-instant)"
    else:
        winner = "Tie (Equal Composite Score)"

    # Print the formatted ASCII summary table
    print("\n" + "=" * 80)
    print("                    EVALFORGE BENCHMARK SUMMARY REPORT")
    print("=" * 80)
    print(f"{'Metric':<28} | {'Google Gemini (1.5 Flash)':<22} | {'Llama 3.1 8B (Groq)':<22}")
    print("-" * 80)
    print(f"{'Average Accuracy (1-5)':<28} | {gemini_avg_acc:<22.2f} | {llama_avg_acc:<22.2f}")
    print(f"{'Average Reasoning (1-5)':<28} | {gemini_avg_reas:<22.2f} | {llama_avg_reas:<22.2f}")
    print(f"{'Average Clarity (1-5)':<28} | {gemini_avg_clar:<22.2f} | {llama_avg_clar:<22.2f}")
    print("-" * 80)
    print(f"{'Accuracy Percentage (%)':<28} | {gemini_acc_pct:<21.2f}% | {llama_acc_pct:<21.2f}%")
    print("=" * 80)
    print(f"🏆 OVERALL WINNER: {winner}")
    print("=" * 80 + "\n")

    return winner


def save_results_to_csv(df: pd.DataFrame, output_path: str = "results.csv") -> None:
    """
    Exports the benchmark evaluation DataFrame to a CSV file.

    Args:
        df (pd.DataFrame): Evaluated benchmark results.
        output_path (str): Destination file path for results.csv.
    """
    try:
        # Export DataFrame to CSV without row index
        df.to_csv(output_path, index=False, encoding="utf-8")
        print(f"[SUCCESS] All evaluation results saved to '{output_path}'.")
    except Exception as error:
        print(f"[ERROR] Failed to save CSV to '{output_path}': {error}")


# ==============================================================================
# 7. MAIN ENTRY POINT (CLI & INTERACTIVE PROMPT SUPPORT)
# ==============================================================================

def main() -> None:
    """
    Main application entry point.
    Parses CLI arguments, sets up clients, loads prompts, and runs the evaluation.
    """
    # Configure command-line arguments
    parser = argparse.ArgumentParser(
        description="EvalForge: Benchmark and compare Gemini vs. Llama on Groq using an LLM Judge."
    )
    # Optional argument for running a single natural language prompt
    parser.add_argument(
        "--prompt",
        type=str,
        default=None,
        help="Natural language prompt for on-the-fly single prompt evaluation.",
    )
    # Optional argument for a custom reference answer with single prompt
    parser.add_argument(
        "--reference",
        type=str,
        default="",
        help="Optional reference ground-truth answer for the single prompt.",
    )
    # Optional argument to specify custom dataset JSON file
    parser.add_argument(
        "--file",
        type=str,
        default="prompts.json",
        help="Path to JSON file containing test prompts (default: prompts.json).",
    )
    # Parse provided arguments
    args = parser.parse_args()

    # Step 1: Load and validate API keys from .env
    gemini_key, groq_key = load_environment()

    # Step 2: Initialize LLM clients
    gemini_model = init_gemini_client(gemini_key)
    groq_client = init_groq_client(groq_key)

    # Step 3: Intake prompts based on user mode
    if args.prompt:
        # Natural Sounding Prompt Mode (Single prompt on-the-fly)
        print(f"[MODE] Running Single Natural Prompt Mode.")
        test_items = [
            {
                "id": 1,
                "category": "Interactive",
                "prompt": args.prompt.strip(),
                "reference_answer": args.reference.strip() or "General factual and logical accuracy expected.",
            }
        ]
    else:
        # Batch JSON Benchmark Mode
        print(f"[MODE] Running Batch JSON Benchmark from '{args.file}'.")
        test_items = load_prompts_file(args.file)

    # Step 4: Run the evaluation pipeline
    results_df = run_benchmark(test_items, gemini_model, groq_client)

    # Step 5: Save results to CSV
    save_results_to_csv(results_df, "results.csv")

    # Step 6: Print formatted summary report and announce winner
    display_summary_table(results_df)


if __name__ == "__main__":
    # Standard Python entrypoint guard
    main()
