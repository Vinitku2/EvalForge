# EvalForge: LLM Evaluation & Benchmarking Suite

EvalForge is a focused GenAI and Data Science benchmarking tool designed to evaluate and compare two Large Language Models (**Google Gemini** vs. **Llama 3.1 on Groq**) using an LLM-as-a-Judge architecture (Gemini Judge) scoring against reference answers across **Accuracy**, **Reasoning**, and **Clarity**, calculating model accuracy percentages and declaring an empirical winner.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Revised Intake & Model Configuration**:
> 1. **Dual Prompt Intake**: 
>    - **Mode A: Natural Language Prompt Area (Interactive Single-Prompt Sandbox)**: A dedicated text area where you can write or paste any free-form natural language question on the fly (with an optional expected answer), click "Evaluate", and watch Gemini vs. Llama compete side-by-side with live judge scoring.
>    - **Mode B: Batch JSON Prompts**: Structured evaluation across test items (such as the 10 curated benchmark prompts in `prompts.json` covering facts, maths, reasoning, and summarization) with full tabular analytics and `results.csv` export.
> 2. **Gemini Plus Optimization**: Tailored to take full advantage of Google Gemini Plus capabilities using `gemini-2.5-flash` / `gemini-1.5-flash` for rapid candidate generation and high-accuracy judging.

- **Confirmed Decision 1 (Python Codebase & Standards)**: Provide production-clean `evalforge.py` supporting both CLI single-prompt mode (`python evalforge.py --prompt "..."`) and batch JSON mode (`python evalforge.py --file prompts.json`), with small functions, complete docstrings, line-by-line comments, retry-backed strict JSON judge parser, and Windows CMD/PowerShell setup instructions.
- **Confirmed Decision 2 (Dataset & Rubric)**: Provide `prompts.json` with 10 diverse benchmark prompts covering factual recall, multi-step math, symbolic reasoning, and text summarization with clear reference answers.
- **Confirmed Decision 3 (Streamlit-Style Interactive Web Applet)**: An authentic Streamlit-themed frontend with an interactive prompt input area (`st.text_area` style), dataset selector, live execution stream, side-by-side response comparator, metric cards, pandas-like DataFrame viewer, CSV export, and Python project file browser.
- **Confirmed Decision 4 (Hindi-English Hinglish README)**: A dedicated `README.md` written in simple, clear Hinglish explaining the line-by-line function mechanics, the mathematical accuracy percentage formula, LLM-as-judge biases/limitations, and 10 common GenAI interview questions and answers.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Dual Input Methods**:
     - **Interactive Input Area (Natural Language)**: Type any custom prompt directly into the UI text box. Optionally provide a reference answer or let the judge evaluate against intrinsic logical correctness.
     - **Batch File Mode (JSON Prompts)**: Load `prompts.json` (or paste custom JSON test items) to evaluate comprehensive multi-category test suites.
  2. **Candidate Generation**:
     - Model A: **Google Gemini Plus** (`gemini-2.5-flash` / `gemini-1.5-flash`)
     - Model B: **Llama 3.1 8B Instant** on Groq (`llama-3.1-8b-instant`)
  3. **Impartial LLM Judge (Gemini)**:
     - Evaluates answers using a strict rubric on an integer scale (1 to 5) across **Accuracy**, **Reasoning**, and **Clarity**, alongside a concise one-line explanation.
  4. **Empirical Scoring & Winner**:
     - Calculates:
       $$\text{Accuracy \%} = \left(\frac{\overline{\text{Accuracy Score}}}{5}\right) \times 100$$
     - Computes average scores, identifies the winning model, logs full details to `results.csv`, and outputs an ASCII summary table.
- **Target Audience**: Data Scientists, GenAI Engineers, and Python developers building portfolio projects or preparing for technical interviews.
- **Key Value**: Demonstrates real-world LLM-as-a-Judge methodology, rigorous prompt engineering, JSON schema enforcement with retries, and data analytics reporting.

---

## 2. User Experience & Visual Design

### Prompt Intake & Key User Flows
1. **Interactive Prompt Sandbox (Natural Sounding Input)**:
   - A clean Streamlit-style `st.text_area` where users can type any natural prompt (e.g. *"Explain quantum entanglement to a 10-year old in 3 bullet points"*).
   - An optional toggle: *"Provide reference answer"* (if testing against ground truth).
   - "⚡ Run Live Evaluation" button triggers parallel calls to Gemini and Llama, followed immediately by the Gemini Judge evaluation.
2. **Batch JSON Benchmark Tab**:
   - Selector to choose the 10 standard prompts (Math, Facts, Reasoning, Summarization) or switch to a JSON editor to test custom suites.
   - Batch progress bar and terminal stdout view.
3. **Side-by-Side Model Comparator**:
   - Split card view:
     - **Left Column (Google Gemini Plus)**: Output text, score gauges (Accuracy / Reasoning / Clarity), and Judge's 1-line reason.
     - **Right Column (Llama 3.1 via Groq)**: Output text, score gauges, and Judge's 1-line reason.
4. **Data Analytics & Winner Dashboard**:
   - KPI metric cards: **Gemini Accuracy %**, **Llama Accuracy %**, **Delta / Margin**, and **Empirical Winner**.
   - Interactive Pandas DataFrame table with sortable columns and a download button for `results.csv`.
5. **Project Code & Hinglish Documentation Hub**:
   - Code viewer with syntax highlighting and copy buttons for `evalforge.py`, `prompts.json`, `requirements.txt`, `.env.example`.
   - Complete `README.md` in friendly Hinglish with step-by-step function breakdowns and 10 interview questions.

### Visual Identity (Streamlit Data Science Look)
- **Aesthetic**: Authentic Streamlit / Data Analytics workspace.
- **Colors**:
  - Primary Accent: Streamlit Red/Coral `#FF4B4B`
  - Workspace Canvas: `#F0F2F6` and clean `#FFFFFF` card surfaces
  - Borders: Crisp `#E6E9EF` 1px lines
  - Typography: System UI sans for headers; monospace (`font-mono`) with `tabular-nums` for code, JSON, and evaluation metrics.
- **Anti-Slop Restraint**: Zero decorative rounded pills for static metadata; clear unboxed metrics and structured scientific layout.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Input Support in both Python CLI and Web UI**
  - *Chosen Approach*: `evalforge.py` can be run in batch mode (`python evalforge.py`) or interactive single-prompt mode (`python evalforge.py --prompt "..."`). The web app provides a toggle between "✍️ Interactive Prompt" and "📁 Batch JSON Benchmark".
  - *Why*: Gives complete flexibility—quick ad-hoc testing and rigorous 10-prompt batch benchmarking.
- **Decision 2: Strict JSON Judge Parser with Fallback & Retry**
  - *Chosen Approach*: Gemini Judge prompt uses system instructions requesting markdown-free JSON, combined with regex extraction and safe error handling.
  - *Why*: Ensures robustness against any formatting variations without crashing the benchmark loop.
- **Decision 3: Standalone Local Python Code + Integrated In-App Runner**
  - *Chosen Approach*: The project root contains actual runnable Python files (`evalforge.py`, `prompts.json`, `requirements.txt`, `.env.example`, `README.md`), while the web applet allows running evaluations directly in the browser using the Gemini API.
  - *Why*: The user can both test it instantly in the browser and run it locally on Windows.

---

## 4. Technical Architecture & Component Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      EvalForge Benchmark Interface                      │
├─────────────────────────────────────────────────────────────────────────┤
│  [Top Bar: Streamlit Style Header & Model Selector (Gemini / Llama)]    │
├───────────────────────────────┬─────────────────────────────────────────┤
│  SIDEBAR                      │  MAIN CONTENT TABS                      │
│  - Mode:                      │  1. ✍️ Single Prompt Sandbox (Text Area) │
│    [x] Interactive Prompt     │  2. 📊 Batch Benchmark (10 Prompts)     │
│    [ ] Batch JSON Benchmark   │  3. 📋 Data Table & CSV Export          │
│  - API Keys Status Check      │  4. 💻 Python Code & Project Files      │
│  - Metric Weights             │  5. 📖 Hinglish README & Interview Q&A  │
└───────────────────────────────┴─────────────────────────────────────────┘
```

### Prompt Item Schema (`prompts.json`):
```json
[
  {
    "id": 1,
    "category": "Factual",
    "prompt": "What causes the aurora borealis, and what role does Earth's magnetic field play?",
    "reference_answer": "Solar wind charged particles collide with Earth's magnetosphere and atmospheric gases, guided by the magnetic field toward the poles where excitation creates light emission."
  }
]
```

---

## 5. Planned Artifacts & Code Deliverables

1. `/evalforge.py`: Standalone Python 3.10+ script with docstrings, line comments, dual CLI modes, Groq + Gemini integration, strict judge scoring, `results.csv` generation, and summary statistics.
2. `/prompts.json`: 10 diverse benchmark items across Facts, Maths, Reasoning, and Summarization with reference answers.
3. `/requirements.txt`: Minimal dependencies (`google-generativeai`, `groq`, `pandas`, `python-dotenv`).
4. `/.env.example`: Template for `GEMINI_API_KEY` and `GROQ_API_KEY`.
5. `/README.md`: Complete Hinglish documentation with line-by-line function walkthroughs, accuracy % explanation, judge limitations, and 10 interview Q&As.
6. `/src/App.tsx`: Interactive Streamlit-styled Data Science interface supporting both interactive prompt text input and batch JSON benchmarks.
7. `/metadata.json` & `/index.html`: Updated with proper branding and SEO.
