# ⚡ EvalForge: LLM Evaluation & Benchmarking Tool

Welcome to **EvalForge**! Yeh ek simple, powerful aur industry-standard **LLM Evaluation (LLM-as-a-Judge)** project hai. 

Is project ka main goal hai: **SAME set of prompts** ko do alag-alag frontier LLMs (**Google Gemini 1.5 Flash** aur **Llama 3.1 8B on Groq**) pe run karna, unke answers ko ek ground-truth reference answer ke against third LLM call (**Gemini Judge**) se strictly score karwana, aur end mein mathematical analysis karke **Winner** declare karna.

---

## 📁 1. Project Folder Structure

Aapke project ka neat and clean folder structure aisa dikhega:

```text
evalforge/
│
├── .env.example          # Environment variables ka sample template (API Keys)
├── .env                  # Aapki actual secret API keys (git mein ignore hoti hai)
├── requirements.txt      # Required Python packages (google-generativeai, groq, pandas, python-dotenv)
├── prompts.json          # 10 diverse benchmark test questions (Facts, Maths, Reasoning, Summarising)
├── evalforge.py          # Main standalone Python script (Inference + Judge + Analytics)
├── results.csv           # Benchmark run hone ke baad automatically generate hone wali CSV file
└── README.md             # Complete step-by-step guide aur interview preparation notes
```

---

## 🪟 2. Exact Commands to Run on Windows (Step-by-Step)

Aap chahe **Windows PowerShell** use kar rahe ho ya **Command Prompt (CMD)**, yeh exact commands follow kijiye:

### Step 1: Project folder open karein
```powershell
cd evalforge
```

### Step 2: Virtual Environment create aur activate karein
Virtual environment banane se aapke system ke global Python packages disturb nahi hote.

**PowerShell mein:**
```powershell
# 1. Virtual environment banayein
python -m venv venv

# 2. Virtual environment activate karein
.\venv\Scripts\Activate.ps1
```
*(Note: Agar PowerShell mein execution policy error aaye, toh run karein: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

**Command Prompt (CMD) mein:**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### Step 3: Required dependencies install karein
Sirf 4 lightweight libraries install karni hain:
```powershell
pip install -r requirements.txt
```

### Step 4: `.env` file banayein aur API keys dalein
`.env.example` ko copy karke `.env` banayein:
```powershell
# PowerShell / CMD:
copy .env.example .env
```
Ab `.env` file ko Notepad ya VS Code mein open karein aur apni real API keys paste karein:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
GROQ_API_KEY=gsk_...your_groq_key_here
```
- **Gemini Key**: [Google AI Studio](https://aistudio.google.com/app/apikey) se free mein milti hai.
- **Groq Key**: [Groq Console](https://console.groq.com/keys) se superfast Llama inference ke liye free milti hai.

### Step 5: Run karein!

**Option A: 10-Prompt Batch Benchmark Run (Standard Mode):**
```powershell
python evalforge.py
```

**Option B: On-the-fly Single Natural Language Prompt Test:**
Agar aapko poori file run nahi karni aur bas ek single prompt test karna hai:
```powershell
python evalforge.py --prompt "Explain the difference between synchronous and asynchronous I/O with an analogy."
```

Execution ke baad terminal mein formatted summary table aayegi aur `results.csv` create ho jayegi!

---

## 🔍 3. Line-by-Line Code & Function Explanation

`evalforge.py` ko bilkul modular, clean aur beginner-friendly banaya gaya hai. Har function ka role samjhte hain:

### Function 1: `load_environment()`
```python
def load_environment() -> Tuple[str, str]:
```
- **Kya karta hai**: `dotenv` library ke `load_dotenv()` function ko call karta hai jo disk pe maujood `.env` file ko scan karta hai aur system environment mein load karta hai.
- **Validation**: `os.getenv("GEMINI_API_KEY")` aur `os.getenv("GROQ_API_KEY")` check karta hai. Agar koi bhi key missing hai, toh user ko clean message dekar exit (`sys.exit(1)`) kar deta hai taaki code aage jakar crash na ho.
- **Return**: Dono validated API keys ka tuple return karta hai.

### Function 2: `init_gemini_client(api_key)`
```python
def init_gemini_client(api_key: str) -> genai.GenerativeModel:
```
- **Kya karta hai**: `genai.configure(api_key=api_key)` call karta hai aur Google ke fast model `gemini-1.5-flash` ka client object create karke return karta hai.
- **Kyun**: Yeh model candidate testing aur judge dono ke liye use hota hai.

### Function 3: `init_groq_client(api_key)`
```python
def init_groq_client(api_key: str) -> Groq:
```
- **Kya karta hai**: Groq SDK ka `Groq(api_key=api_key)` client initialize karta hai. Groq LPUs pe Llama 3.1 8B instant inference provide karta hai jo 500+ tokens per second deliver karta hai.

### Function 4: `load_prompts_file(filepath)`
```python
def load_prompts_file(filepath: str = "prompts.json") -> List[Dict[str, Any]]:
```
- **Kya karta hai**: `os.path.exists` se check karta hai ki dataset file exist karti hai ya nahi. Phir `json.load()` se file read karke Python dictionary ki list return karta hai.
- **Safety**: Agar file invalid JSON hai ya array format mein nahi hai, toh readable error print karta hai.

### Function 5: `call_gemini(model, prompt_text)`
```python
def call_gemini(model: genai.GenerativeModel, prompt_text: str) -> str:
```
- **Kya karta hai**: Candidate Model A (Gemini) ko user prompt bhejta hai: `response = model.generate_content(prompt_text)`.
- **Error Handling**: `try-except` block use karta hai taaki agar network issue ya rate limit aaye toh program crash hone ke bajaye error string return kare.

### Function 6: `call_llama_groq(client, prompt_text)`
```python
def call_llama_groq(client: Groq, prompt_text: str) -> str:
```
- **Kya karta hai**: Candidate Model B (Llama 3.1 8B Instant) ko Groq API ke through call karta hai:
  `client.chat.completions.create(model="llama-3.1-8b-instant", messages=[...], temperature=0.3)`.
- **Temperature = 0.3**: Benchmarking mein low temperature rakha jata hai taaki model hallucinate na kare aur deterministic deterministic answers de.

### Function 7: `extract_json_safely(raw_text)`
```python
def extract_json_safely(raw_text: str) -> Optional[Dict[str, Any]]:
```
- **Kyun zaroori hai**: LLMs kabhi-kabhi JSON ke aage ya peeche markdown ya introductory text (`Here is the JSON: ...`) likh dete hain.
- **Regex Logic**: `re.search(r"\{.*\}", raw_text, re.DOTALL)` se sirf `{` se `}` tak ka exact JSON substring extract karta hai.
- **Validation & Clamping**: Yeh check karta hai ki chaaro required keys (`accuracy`, `reasoning`, `clarity`, `reason`) maujood hain aur numerical scores 1 se 5 ke beech mein clamp ho rahe hain (`max(1, min(5, int(...)))`).

### Function 8: `judge_answer(judge_model, prompt_text, reference_answer, candidate_answer, max_retries=2)`
```python
def judge_answer(...) -> Dict[str, Any]:
```
- **Core of the Project**: Yeh LLM-as-a-Judge implement karta hai.
- **Prompt Engineering**: Judge ko ek strict evaluation prompt diya jata hai jisme:
  1. Original Question
  2. Ground Truth Reference Answer
  3. Candidate ka actual Answer
  4. 1-to-5 Rubric details (Accuracy, Reasoning, Clarity)
  5. Strict instruction: "Output ONLY a valid JSON object".
- **Retry Loop**: Agar pehli baar mein judge ka JSON decode nahi ho pata, toh loop turant break nahi hota; yeh 2 baar retry karta hai (`time.sleep(1)` ke saath). Agar fir bhi fail ho jaye, toh graceful fallback dictionary return karta hai.

### Function 9: `calculate_accuracy_percentage(avg_accuracy_score)`
```python
def calculate_accuracy_percentage(avg_accuracy_score: float) -> float:
```
- **Formula**: `(avg_accuracy_score / 5.0) * 100.0`
- **Role**: 1 se 5 ke scale ko 0% se 100% human-interpretable accuracy percentage mein convert karta hai.

### Function 10: `run_benchmark(items, gemini_model, groq_client)`
```python
def run_benchmark(...) -> pd.DataFrame:
```
- **Kya karta hai**: Saare prompts pe loop chalata hai. Har prompt ke liye:
  1. Gemini se answer leta hai.
  2. Llama se answer leta hai.
  3. Judge se Gemini ka answer score karwata hai.
  4. Judge se Llama ka answer score karwata hai.
  5. Saara data ek structured dictionary list mein collect karke `pandas.DataFrame` bana kar return karta hai.

### Function 11: `display_summary_table(df)` & `save_results_to_csv(df)`
```python
def display_summary_table(df: pd.DataFrame) -> str:
def save_results_to_csv(df: pd.DataFrame, output_path: str = "results.csv") -> None:
```
- **Analytics**: Pandas ke `.mean()` method se average accuracy, reasoning aur clarity calculate karta hai.
- **Composite Score Formula**:
  $$\text{Composite Score} = (0.50 \times \text{Accuracy}) + (0.30 \times \text{Reasoning}) + (0.20 \times \text{Clarity})$$
  Is mathematical weightage ke basis par overall **Winner** announce hota hai.
- **CSV Export**: `df.to_csv("results.csv", index=False)` se poora granular data export karta hai.

### Function 12: `main()`
- Application ka CLI orchestrator. `argparse` se parameters parse karta hai aur step-by-step pipeline execute karta hai.

---

## 📊 4. How Accuracy Percentage is Calculated

Evaluation mein raw rubric scores **1 se 5 integer scale** par hote hain:
- $1 = \text{Completely Wrong / Hallucinated}$
- $3 = \text{Partially Correct / Missing Core Points}$
- $5 = \text{Perfect Accuracy / Matches Ground Truth Perfectly}$

### Mathematical Formula:
$$\text{Accuracy Percentage (\%)} = \left( \frac{\sum_{i=1}^{N} \text{Accuracy Score}_i}{5 \times N} \right) \times 100 = \left( \frac{\text{Average Accuracy Score}}{5.0} \right) \times 100$$

### Numerical Example:
Suppose 10 test prompts par Model A ke accuracy scores ka sum $42$ aaya:
- **Average Accuracy Score**: $\frac{42}{10} = 4.20$ out of $5.0$
- **Accuracy Percentage**: $\left(\frac{4.20}{5.0}\right) \times 100 = 84.00\%$

Yeh percentage Data Science dashboards aur executive reporting mein easily understandable hoti hai.

---

## ⚠️ 5. Limitations of LLM-as-a-Judge

Interviewers often ask: *"LLM ko judge banana kitna reliable hai?"* 
Real-world systems mein LLM-as-a-Judge ke 6 critical limitations hote hain jo aapko pata hone chahiye:

1. **Position Bias (Order Effect)**:
   - Jab do answers ko pairwise compare kiya jata hai, toh models aksar Option A (pehla answer) ko zyada preference dete hain regardless of quality.
   - *Mitigation*: Candidates ka order swap karke do baar evaluate karna (`(A, B)` and `(B, A)`).

2. **Verbosity Bias (Length Bias)**:
   - LLM judges lambe aur verbose answers ko zyada intelligent samajh kar artificially high score de dete hain, chahe concise answer zyada accurate ho.
   - *Mitigation*: Rubric mein strict conciseness constraint aur clarity penalty define karna.

3. **Self-Enhancement / Egocentric Bias**:
   - Google Gemini jab judge hota hai, toh woh subtly Gemini-style phrasing ko prefer kar sakta hai, aur GPT models GPT ke style ko.
   - *Mitigation*: Blind evaluation (judge ko candidate model ka naam na batana) aur independent third-party judge use karna.

4. **Non-Deterministic Scoring & Temperature Drift**:
   - Agar temperature > 0 ho, toh same answer ko do alag runs mein alag scores mil sakte hain (e.g. ek baar 4, agli baar 5).
   - *Mitigation*: Temperature 0.0 ya 0.1 set karna aur multiple judging runs ka average lena.

5. **Hallucination in Reasoning**:
   - Judge khud mathematical calculation ya factual verification mein galti kar sakta hai agar reference answer complete na ho.
   - *Mitigation*: Reference ground truth explicitly prompt ke andar inject karna (jaise EvalForge mein kiya gaya hai).

6. **Reference Leakage & Grading Difficulty**:
   - Open-ended creative prompts (jaise summarization ya coding) mein ek single ground truth answer nahi hota, jisse deterministic scoring tough ho jati hai.

---

## 🎯 6. Top 10 GenAI & LLM Evaluation Interview Questions (With Answers)

### Q1: What is LLM-as-a-Judge, and why is it preferred over traditional NLP metrics like BLEU or ROUGE?
**Answer (Hinglish)**:
"Traditional metrics jaise BLEU aur ROUGE purely **n-gram matching** (exact word overlap) par depend karte hain. Agar candidate model ne reference answer ka exact synonym ya paraphrase use kiya, toh BLEU/ROUGE ka score drop ho jata hai chahe answer scientifically 100% accurate ho! 
LLM-as-a-Judge **semantic understanding** aur contextual reasoning par score karta hai, jisse factual correctness, step-by-step logic aur human-like evaluation achieve hota hai."

### Q2: Why did you choose an integer scale of 1 to 5 instead of 1 to 10 or 1 to 100?
**Answer (Hinglish)**:
"Cognitive science aur psychometrics ke research ke hisab se 1 to 5 Likert scale par LLMs ka **inter-annotator agreement** aur consistency sabse high rehta hai. 1 se 100 ke scale par LLMs ke liye 82 aur 84 ke beech distinguish karna noisy aur arbitrary hota hai, jabki 1 to 5 scale par clear qualitative anchors (1=Incorrect, 3=Partial, 5=Perfect) define karna bohot stable hota hai."

### Q3: How did you ensure the Judge model outputs valid, parseable JSON every time?
**Answer (Hinglish)**:
"Maine 3 layers of defensive engineering implement ki:
1. **Prompt constraint**: Judge prompt mein explicitly instruct kiya ki markdown backticks ya preamble na de, sirf valid JSON de.
2. **Regex extraction**: `re.search(r'\{.*\}', raw_text, re.DOTALL)` use kiya jo response ke andar se pure JSON block ko extract kar leta hai chahe model conversational chatter add kar de.
3. **Retry Mechanism with Backoff**: Agar JSON invalid ho, toh code 2 baar automatic retry karta hai, aur failure par clean default fallback return karta hai taaki pipeline crash na ho."

### Q4: What is the difference between Reference-based vs. Reference-free evaluation?
**Answer (Hinglish)**:
"- **Reference-based Evaluation**: Judge ke paas user prompt ke saath ground-truth 'reference answer' bhi hota hai (jaise EvalForge mein). Yeh factual accuracy aur math verification ke liye best hota hai.
- **Reference-free Evaluation**: Judge sirf prompt aur candidate answer ko evaluate karta hai bina kisi pre-written ground truth ke (jaise conversational coherence, toxicity, ya tone checking). Yeh open-ended chatbots ke liye use hota hai."

### Q5: How do you prevent Position Bias when using LLM as a judge?
**Answer (Hinglish)**:
"Position bias ko solve karne ke liye hum **Order Permutation / Swap Evaluation** karte hain. Ek prompt ke answers ko do baar pass karte hain: pehle `[Model A as Answer 1, Model B as Answer 2]`, phir `[Model B as Answer 1, Model A as Answer 2]`. Dono runs ke scores ka average lene se position bias cancel out ho jata hai."

### Q6: Why did you separate Accuracy, Reasoning, and Clarity instead of taking a single overall score?
**Answer (Hinglish)**:
"Single score lene se model ki specific weakness hide ho jati hai. For example, ek model accurate ho sakta hai par explanation confusing ho (High Accuracy, Low Clarity). Doosra model well-formatted aur polite ho sakta hai par hallucinated information de (High Clarity, Low Accuracy). Multi-dimensional scoring se hume granular root-cause analysis milta hai."

### Q7: What is Verbosity Bias, and how does EvalForge handle it?
**Answer (Hinglish)**:
"Verbosity bias ka matlab hai ki LLM judge naturally lambe answers ko zyada knowledgeable samajh leta hai. EvalForge mein rubric prompt ke andar explicit reference answer provided hai, aur judge ko evaluate karte waqt instruction diya gaya hai ki woh factual alignment aur step-by-step reasoning score kare na ki answer ki length ko."

### Q8: What are common frameworks in the industry for LLM evaluation?
**Answer (Hinglish)**:
"Industry mein popular frameworks hain:
1. **Ragas**: RAG pipelines ke retrieval aur generation metrics (faithfulness, answer relevance) ke liye.
2. **DeepEval**: Production unit-testing framework for LLMs.
3. **AlpacaEval & MT-Bench**: General-purpose instruction following benchmarks using GPT-4 judge.
EvalForge ek custom, lightweight Python implementation hai jo inhi standard principles par build kiya gaya hai without third-party framework overhead."

### Q9: Why did you use Llama 3.1 8B on Groq instead of running it locally via Ollama?
**Answer (Hinglish)**:
"Groq LPUs (Language Processing Units) Llama 3.1 ko ultra-low latency (500-800 tokens/second) par serve karte hain bina user ke system par high-end GPU ya heavy RAM consumption ke. Isse benchmark seconds mein complete ho jata hai jabki local Ollama run CPU par kaafi slow ho sakta hai."

### Q10: How would you scale EvalForge to benchmark across 10,000 prompts in a production setting?
**Answer (Hinglish)**:
"Production scale par 10k prompts evaluate karne ke liye:
1. **Async / Batch API**: Python `asyncio` + `aiohttp` ya provider ke Batch API (jaise Gemini Batch API) use karenge to avoid rate limits and reduce cost by 50%.
2. **Caching**: Same prompt-model pairs ke outputs ko Redis ya SQLite mein cache karenge.
3. **Distributed Worker Queue**: Celery ya AWS SQS ke through parallel workers run karenge.
4. **Sampling & Statistical Significance**: Har bar 10,000 run karne ke bajaye confidence intervals (bootstrap sampling) use karenge."

---

## 🚀 7. Key Takeaways

EvalForge demonstrates:
- End-to-end LLM benchmarking pipeline.
- Production-grade prompt engineering for structured JSON evaluation.
- Clean Python 3.10+ architecture with robust error resilience.
- Practical understanding of GenAI evaluation metrics, biases, and trade-offs.

**Happy Benchmarking! 🎯**
