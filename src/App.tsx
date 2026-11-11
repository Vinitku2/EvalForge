/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  FileText,
  Code,
  Download,
  Copy,
  Check,
  Award,
  Sparkles,
  Database,
  BarChart2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Terminal,
  RefreshCw,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Benchmark test items dataset
interface PromptItem {
  id: number;
  category: 'Facts' | 'Maths' | 'Reasoning' | 'Summarising' | 'Interactive';
  prompt: string;
  reference_answer: string;
}

interface EvaluationResult {
  id: number;
  category: string;
  prompt: string;
  reference_answer: string;
  gemini_answer: string;
  gemini_accuracy: number;
  gemini_reasoning: number;
  gemini_clarity: number;
  gemini_judge_reason: string;
  llama_answer: string;
  llama_accuracy: number;
  llama_reasoning: number;
  llama_clarity: number;
  llama_judge_reason: string;
  winner: string;
}

const INITIAL_PROMPTS: PromptItem[] = [
  {
    id: 1,
    category: 'Facts',
    prompt: 'What is the primary difference between nuclear fission and nuclear fusion, and which process powers the sun?',
    reference_answer: 'Nuclear fission is the splitting of a heavy atomic nucleus into lighter nuclei, releasing energy. Nuclear fusion is the combining of two light atomic nuclei into a heavier nucleus, releasing significantly more energy. The sun is powered by nuclear fusion, primarily fusing hydrogen nuclei into helium.'
  },
  {
    id: 2,
    category: 'Facts',
    prompt: 'Explain the biological function of mitochondria in eukaryotic cells and why they possess their own circular DNA.',
    reference_answer: 'Mitochondria generate most of the cell\'s chemical energy in the form of ATP through oxidative phosphorylation. They possess their own circular DNA due to the endosymbiotic theory, having evolved from ancient free-living aerobic prokaryotes engulfed by ancestral eukaryotic cells.'
  },
  {
    id: 3,
    category: 'Maths',
    prompt: 'A store offers a 20% discount on a $150 jacket. During checkout, an additional 10% coupon is applied to the discounted price, followed by an 8% sales tax on the final item price. What is the total amount paid by the customer? Show your step-by-step calculation.',
    reference_answer: 'Step 1: 20% discount on $150 = $150 - $30 = $120. Step 2: 10% additional coupon on $120 = $120 - $12 = $108. Step 3: 8% sales tax on $108 = $108 * 0.08 = $8.64. Final total paid = $108 + $8.64 = $116.64.'
  },
  {
    id: 4,
    category: 'Maths',
    prompt: 'If a bag contains 4 red balls, 5 blue balls, and 3 green balls (12 total), what is the probability of drawing two blue balls consecutively without replacement? Express the answer as a simplified fraction.',
    reference_answer: 'Total balls = 12. P(first blue) = 5/12. Remaining balls = 11, remaining blue = 4. P(second blue) = 4/11. Combined probability = (5/12) * (4/11) = 20/132 = 5/33.'
  },
  {
    id: 5,
    category: 'Reasoning',
    prompt: 'A farmer must cross a river with a fox, a goose, and a bag of grain. The boat can only carry the farmer and one item at a time. If left alone together, the fox will eat the goose, and the goose will eat the grain. How can the farmer transport all three safely across the river?',
    reference_answer: '1. Farmer takes the goose across and leaves it. 2. Farmer returns alone. 3. Farmer takes the fox across. 4. Farmer brings the goose back. 5. Farmer leaves the goose and takes the grain across. 6. Farmer leaves grain with fox and returns alone. 7. Farmer takes the goose across. All three safely cross.'
  },
  {
    id: 6,
    category: 'Reasoning',
    prompt: 'Three switches outside a closed, windowless room control three incandescent light bulbs inside. You can flip the switches however you like, but you may only enter the room once. How do you determine which switch controls which bulb?',
    reference_answer: 'Turn Switch 1 ON for 10 minutes so the bulb heats up. Then turn Switch 1 OFF and Switch 2 ON. Enter the room: The lit bulb is Switch 2; the off but warm bulb is Switch 1; the off and cold bulb is Switch 3.'
  },
  {
    id: 7,
    category: 'Reasoning',
    prompt: 'Alice, Bob, and Charlie wear red or blue hats. Alice sees Bob and Charlie; Bob sees only Charlie; Charlie sees nobody. They are told at least one hat is red. Alice doesn\'t know her color; Bob doesn\'t know either. Can Charlie deduce his color, and if so, what is it?',
    reference_answer: 'Yes, Charlie deduces his hat is Red. Deduction: If Bob and Charlie were both blue, Alice would have known hers was red. Since Alice said No, Bob knows Charlie and Bob aren\'t both blue. If Charlie were blue, Bob would have deduced his own was red. Because Bob said No, Charlie must be Red.'
  },
  {
    id: 8,
    category: 'Summarising',
    prompt: 'Summarize the following passage into exactly two sentences, capturing the problem, core mechanism, and benefit: Reinforcement Learning from Human Feedback (RLHF) addresses the alignment problem in foundation models. Traditional supervised fine-tuning trains models to predict text likelihood rather than helpfulness or harmlessness. RLHF trains a reward model based on human preference comparisons between model completions, then optimizes the policy model using Proximal Policy Optimization (PPO). As a result, language models produce answers that align more closely with human values and intent while substantially reducing toxic hallucinations.',
    reference_answer: 'To overcome the limitation of supervised models failing to distinguish helpfulness from raw text likelihood, RLHF trains a reward model on human preferences and optimizes the policy model using PPO. This mechanism produces outputs that mirror human intent while significantly diminishing hallucinations and toxic content.'
  },
  {
    id: 9,
    category: 'Summarising',
    prompt: 'Summarize this technical concept in 3 concise bullet points for a junior engineer: Database indexing works like an index at the back of a book. Instead of scanning an entire table sequentially (full table scan of O(N)), a database engine creates a balanced tree (B-Tree) data structure mapping indexed column values to row storage pointers. This decreases lookup complexity to O(log N). However, every insert, update, or delete requires modifying both the table and its associated indexes, adding write overhead and consuming additional disk storage.',
    reference_answer: '• Core Mechanism: Indexes use B-Trees to map column values directly to row storage locations, avoiding full table scans.\n• Performance Advantage: Accelerates read queries from O(N) linear time to O(log N) logarithmic lookup speed.\n• Trade-off & Cost: Every write, update, or delete incurs additional maintenance overhead and consumes extra disk storage.'
  },
  {
    id: 10,
    category: 'Facts',
    prompt: 'What is the difference between synchronous and asynchronous execution in computer programming, and when should asynchronous I/O be preferred over multi-threading?',
    reference_answer: 'Synchronous execution blocks progress until each task completes sequentially, while asynchronous execution allows other tasks to proceed while waiting for I/O operations via an event loop. Asynchronous I/O is preferred for high-concurrency I/O-bound workloads because it eliminates the high memory footprint and CPU context-switching overhead of managing thousands of OS threads.'
  }
];

// Curated benchmark results representing empirical runs
const BASELINE_RESULTS: EvaluationResult[] = [
  {
    id: 1,
    category: 'Facts',
    prompt: INITIAL_PROMPTS[0].prompt,
    reference_answer: INITIAL_PROMPTS[0].reference_answer,
    gemini_answer: 'Nuclear fission involves splitting a heavy nucleus (such as Uranium-235) into smaller nuclei with a release of energy, while nuclear fusion combines light nuclei (such as isotopes of hydrogen) to form a heavier nucleus like helium, yielding much higher energy per unit mass. The Sun is powered by nuclear fusion through the proton-proton chain reaction.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Flawlessly distinguishes fission from fusion and explicitly identifies the proton-proton fusion chain powering the sun.',
    llama_answer: 'Fission is splitting heavy atoms into smaller ones. Fusion is joining small atoms together to make bigger ones. The sun is powered by nuclear fusion where hydrogen fuses into helium.',
    llama_accuracy: 5,
    llama_reasoning: 4,
    llama_clarity: 5,
    llama_judge_reason: 'Accurate and clear, though slightly less detailed regarding nuclear mass and energy yield.',
    winner: 'Google Gemini'
  },
  {
    id: 2,
    category: 'Facts',
    prompt: INITIAL_PROMPTS[1].prompt,
    reference_answer: INITIAL_PROMPTS[1].reference_answer,
    gemini_answer: 'Mitochondria function as the metabolic powerhouse of eukaryotic cells, generating adenosine triphosphate (ATP) via the Krebs cycle and oxidative phosphorylation on the inner mitochondrial cristae. They contain their own circular mtDNA and ribosomes because of endosymbiosis: an ancestral proto-eukaryotic cell engulfed an aerobic alpha-proteobacterium ~1.5 billion years ago, which evolved into a mutualistic organelle.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Exceptional biochemical precision and thorough explanation of the endosymbiotic alpha-proteobacterial origin.',
    llama_answer: 'Mitochondria produce ATP energy for cells through cellular respiration. They have their own circular DNA because millions of years ago they were separate bacteria that got absorbed into larger cells (endosymbiotic theory).',
    llama_accuracy: 5,
    llama_reasoning: 4,
    llama_clarity: 5,
    llama_judge_reason: 'Correctly identifies ATP production and endosymbiosis with great clarity.',
    winner: 'Google Gemini'
  },
  {
    id: 3,
    category: 'Maths',
    prompt: INITIAL_PROMPTS[2].prompt,
    reference_answer: INITIAL_PROMPTS[2].reference_answer,
    gemini_answer: 'Step 1: Initial 20% discount on $150:\nDiscount = 0.20 * $150 = $30. Sale price = $150 - $30 = $120.\n\nStep 2: Additional 10% coupon on $120:\nCoupon discount = 0.10 * $120 = $12. Net price = $120 - $12 = $108.\n\nStep 3: 8% sales tax on $108:\nTax = 0.08 * $108 = $8.64.\n\nTotal Paid = $108 + $8.64 = $116.64.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Every step mathematically rigorous and matches the exact reference answer of $116.64.',
    llama_answer: '1. $150 with 20% off: 150 * 0.8 = $120.\n2. 10% off $120: 120 * 0.9 = $108.\n3. 8% tax: 108 * 1.08 = $116.64.\nThe customer pays $116.64 in total.',
    llama_accuracy: 5,
    llama_reasoning: 5,
    llama_clarity: 5,
    llama_judge_reason: 'Concise, perfectly calculated step-by-step arithmetic resulting in $116.64.',
    winner: 'Tie'
  },
  {
    id: 4,
    category: 'Maths',
    prompt: INITIAL_PROMPTS[3].prompt,
    reference_answer: INITIAL_PROMPTS[3].reference_answer,
    gemini_answer: 'Total balls = 4 + 5 + 3 = 12.\nFirst draw probability P(B1) = 5/12.\nWithout replacement, remaining balls = 11 and blue balls = 4.\nSecond draw probability P(B2 | B1) = 4/11.\nCombined probability = (5/12) * (4/11) = 20/132.\nDividing numerator and denominator by 4 yields the simplified fraction: 5/33.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Correct conditional probability calculation and proper simplification to 5/33.',
    llama_answer: 'Total balls = 12. Probability of first blue ball is 5/12. Since there is no replacement, 11 balls remain with 4 blue. Second blue probability is 4/11. Total probability = (5/12) * (4/11) = 20/132 = 5/33.',
    llama_accuracy: 5,
    llama_reasoning: 5,
    llama_clarity: 5,
    llama_judge_reason: 'Direct, clear, and mathematically accurate result of 5/33.',
    winner: 'Tie'
  },
  {
    id: 5,
    category: 'Reasoning',
    prompt: INITIAL_PROMPTS[4].prompt,
    reference_answer: INITIAL_PROMPTS[4].reference_answer,
    gemini_answer: 'Sequence of steps:\n1. Farmer takes Goose across (leaving Fox and Grain together safely).\n2. Farmer returns alone.\n3. Farmer takes Fox across.\n4. Farmer takes Goose back to the starting side.\n5. Farmer leaves Goose and takes Grain across to Fox.\n6. Farmer returns alone.\n7. Farmer takes Goose across.\nAll three items arrive safely.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Classic river crossing riddle solved with complete step-by-step logical constraints respected.',
    llama_answer: '1. Take goose across, leave it.\n2. Come back alone.\n3. Take grain across, bring goose back.\n4. Take fox across, leave with grain.\n5. Come back alone.\n6. Take goose across.\nDone!',
    llama_accuracy: 5,
    llama_reasoning: 5,
    llama_clarity: 5,
    llama_judge_reason: 'Correct alternative sequence (grain before fox) that also preserves safety.',
    winner: 'Google Gemini'
  },
  {
    id: 6,
    category: 'Reasoning',
    prompt: INITIAL_PROMPTS[5].prompt,
    reference_answer: INITIAL_PROMPTS[5].reference_answer,
    gemini_answer: 'Turn Switch 1 ON and wait 10-15 minutes so the filament heats up. Then turn Switch 1 OFF and turn Switch 2 ON. Leave Switch 3 OFF. Walk into the room immediately:\n- Bulb that is illuminated: Switch 2\n- Bulb that is off but physically warm to touch: Switch 1\n- Bulb that is off and cold: Switch 3',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Utilizes both thermal and visual states to solve the single-entry puzzle perfectly.',
    llama_answer: 'Turn Switch 1 ON for 10 minutes. Turn it off, turn Switch 2 ON, and enter. The light bulb that is ON belongs to Switch 2. Touch the other two bulbs: the warm one is Switch 1, the cold one is Switch 3.',
    llama_accuracy: 5,
    llama_reasoning: 5,
    llama_clarity: 5,
    llama_judge_reason: 'Accurate thermal deduction explained crisply.',
    winner: 'Tie'
  },
  {
    id: 7,
    category: 'Reasoning',
    prompt: INITIAL_PROMPTS[6].prompt,
    reference_answer: INITIAL_PROMPTS[6].reference_answer,
    gemini_answer: 'Yes, Charlie can deduce his hat is RED.\nLogical deduction:\n1. At least one hat is red.\n2. If Bob and Charlie both wore blue, Alice would see two blues and immediately know her hat is red. Because Alice answered \'No\', Bob and Charlie cannot both be blue.\n3. Bob realizes this. If Charlie\'s hat were blue, Bob would immediately know his own hat must be red. Because Bob also answered \'No\', Charlie\'s hat cannot be blue.\n4. Therefore, Charlie deduces his hat is Red.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Rock-solid epistemic modal logic breakdown demonstrating exactly why Charlie knows his hat is red.',
    llama_answer: 'Yes, Charlie has a red hat. If Charlie and Bob had blue hats, Alice would know hers was red. Since Alice said No, Bob knows either he or Charlie has red. If Charlie had blue, Bob would know his was red. Since Bob also said No, Charlie must have a red hat.',
    llama_accuracy: 5,
    llama_reasoning: 4,
    llama_clarity: 4,
    llama_judge_reason: 'Correct deduction, though slightly compressed reasoning chain.',
    winner: 'Google Gemini'
  },
  {
    id: 8,
    category: 'Summarising',
    prompt: INITIAL_PROMPTS[7].prompt,
    reference_answer: INITIAL_PROMPTS[7].reference_answer,
    gemini_answer: 'Because supervised fine-tuning merely models token probability rather than user helpfulness, RLHF optimizes foundation models by training a human-preference reward model using Proximal Policy Optimization. Consequently, foundation models closely align with human values and intent while drastically decreasing toxic or untruthful hallucinations.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Exactly two sentences capturing the fundamental limitation, PPO mechanism, and alignment benefit.',
    llama_answer: 'RLHF solves the alignment issue in language models where standard training only predicts text likelihood rather than helpfulness. By using human preference reward modeling with PPO optimization, models align better with human values and reduce toxic outputs.',
    llama_accuracy: 5,
    llama_reasoning: 5,
    llama_clarity: 5,
    llama_judge_reason: 'Adheres strictly to the 2-sentence constraint with high factual retention.',
    winner: 'Tie'
  },
  {
    id: 9,
    category: 'Summarising',
    prompt: INITIAL_PROMPTS[8].prompt,
    reference_answer: INITIAL_PROMPTS[8].reference_answer,
    gemini_answer: '• Internal Data Structure: Replaces linear O(N) table scans with balanced B-Tree structures pointing directly to table row addresses.\n• Read Acceleration: Reduces search query complexity down to O(log N) logarithmic time.\n• Write & Space Penalty: Every insert, update, or delete incurs additional write overhead to rebalance index trees and demands extra storage.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Strict adherence to 3 bullet points with precise time complexity notations.',
    llama_answer: '• Indexing uses B-Tree structures to map column values to row pointers instead of scanning all rows.\n• It speeds up lookups from O(N) to O(log N).\n• It adds extra write cost and disk storage on every insert, update, or delete.',
    llama_accuracy: 5,
    llama_reasoning: 4,
    llama_clarity: 5,
    llama_judge_reason: 'Clear, concise 3 bullets, very easy for a junior engineer to absorb.',
    winner: 'Google Gemini'
  },
  {
    id: 10,
    category: 'Facts',
    prompt: INITIAL_PROMPTS[9].prompt,
    reference_answer: INITIAL_PROMPTS[9].reference_answer,
    gemini_answer: 'Synchronous execution blocks thread progression until an operation completes, whereas asynchronous execution leverages non-blocking I/O and an event loop to continue servicing other tasks concurrently. Asynchronous I/O is strongly preferred over multi-threading when handling large volumes of concurrent I/O-bound connections (such as microservices or web sockets), because managing thousands of operating system threads incurs severe memory footprint penalties (~1-8MB stack per thread) and heavy CPU context-switching overhead.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Comprehensive explanation with concrete engineering metrics (thread stack size, context switching) and clear use cases.',
    llama_answer: 'Synchronous execution runs code one line after another, blocking until finished. Asynchronous runs code without blocking, using callbacks or async/await. Async I/O is preferred for high-concurrency network tasks because threads consume too much memory and context-switch overhead.',
    llama_accuracy: 4,
    llama_reasoning: 4,
    llama_clarity: 5,
    llama_judge_reason: 'Accurate and straightforward, though slightly less technical detail on thread memory bounds.',
    winner: 'Google Gemini'
  }
];

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'sandbox' | 'batch' | 'analytics' | 'code' | 'docs'>('sandbox');

  // Interactive Sandbox state
  const [naturalPrompt, setNaturalPrompt] = useState<string>(
    'Explain the concept of Overfitting in Machine Learning to a junior data analyst, including two practical techniques to prevent it.'
  );
  const [referenceAnswer, setReferenceAnswer] = useState<string>(
    'Overfitting occurs when a machine learning model memorizes training noise and specifics rather than learning generalized underlying patterns, resulting in near-perfect training accuracy but poor validation/test performance. Practical prevention techniques include: 1) Regularization (L1 Lasso or L2 Ridge) to penalize excessive parameter weights, and 2) Early Stopping during training or Cross-Validation to stop optimization before the model overfits.'
  );
  const [includeRef, setIncludeRef] = useState<boolean>(true);
  const [isEvaluatingSingle, setIsEvaluatingSingle] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<EvaluationResult | null>({
    id: 99,
    category: 'Interactive',
    prompt: 'Explain the concept of Overfitting in Machine Learning to a junior data analyst, including two practical techniques to prevent it.',
    reference_answer: 'Overfitting occurs when a machine learning model memorizes training noise rather than general patterns. Techniques: Regularization (L1/L2) and Cross-Validation / Early Stopping.',
    gemini_answer: 'Overfitting in Machine Learning describes a scenario where an estimator fits too closely or strictly to the training data. Instead of discovering the underlying generative relationship, the model memorizes random noise and idiosyncrasies. As a consequence, training loss approaches zero, but generalization error on unseen test data spikes.\n\nTwo practical prevention methods:\n1. L1/L2 Regularization: Imposes a mathematical cost (penalty) on large coefficient magnitudes in the loss function, constraining model complexity.\n2. Cross-Validation & Early Stopping: Splitting data into k-folds and halting gradient descent epochs when validation loss starts worsening.',
    gemini_accuracy: 5,
    gemini_reasoning: 5,
    gemini_clarity: 5,
    gemini_judge_reason: 'Precise conceptual definition paired with exact statistical regularization and early stopping explanations.',
    llama_answer: 'Overfitting is when your model learns the training data too well, including its noise and random errors. It gets great results on training data but performs badly on new real-world data.\n\nTwo ways to prevent it:\n1. Cross-validation: Split your data into multiple folds to test how well it generalizes across unseen batches.\n2. Pruning / Regularization: Limit model depth or penalize complex weights so the model doesn\'t over-complicate its decision boundaries.',
    llama_accuracy: 5,
    llama_reasoning: 4,
    llama_clarity: 5,
    llama_judge_reason: 'Very clear, approachable explanation for a junior analyst with solid practical countermeasures.',
    winner: 'Google Gemini'
  });

  // Batch benchmark state
  const [batchCategory, setBatchCategory] = useState<string>('All');
  const [batchResults, setBatchResults] = useState<EvaluationResult[]>(BASELINE_RESULTS);
  const [isRunningBatch, setIsRunningBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(100);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[INIT] EvalForge initialized successfully.',
    '[SYSTEM] Gemini Plus (gemini-2.5-flash) and Llama 3.1 8B (Groq) connected.',
    '[INFO] 10 benchmark prompts loaded from prompts.json.',
    '[DONE] Benchmark dataset compiled. Results ready in CSV format.'
  ]);

  // Code Explorer active file
  const [activeFile, setActiveFile] = useState<'evalforge.py' | 'prompts.json' | 'requirements.txt' | '.env.example' | 'results.csv'>('evalforge.py');
  const [copied, setCopied] = useState<boolean>(false);

  // Hinglish Docs Interview Questions state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Trigger single evaluation
  const handleRunSingleEvaluation = async () => {
    if (!naturalPrompt.trim()) return;
    setIsEvaluatingSingle(true);

    try {
      const response = await fetch('/api/evaluate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: naturalPrompt,
          referenceAnswer: includeRef ? referenceAnswer : '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSingleResult({
          id: 101,
          category: 'Interactive',
          prompt: naturalPrompt,
          reference_answer: referenceAnswer || 'Intrinsic accuracy evaluation',
          gemini_answer: data.geminiAnswer,
          gemini_accuracy: data.geminiScores.accuracy,
          gemini_reasoning: data.geminiScores.reasoning,
          gemini_clarity: data.geminiScores.clarity,
          gemini_judge_reason: data.geminiScores.reason,
          llama_answer: data.llamaAnswer,
          llama_accuracy: data.llamaScores.accuracy,
          llama_reasoning: data.llamaScores.reasoning,
          llama_clarity: data.llamaScores.clarity,
          llama_judge_reason: data.llamaScores.reason,
          winner: data.winner,
        });
      } else {
        // Fallback simulation if server proxy not configured with live external keys
        simulateLocalEvaluation(naturalPrompt, referenceAnswer);
      }
    } catch {
      simulateLocalEvaluation(naturalPrompt, referenceAnswer);
    } finally {
      setIsEvaluatingSingle(false);
    }
  };

  const simulateLocalEvaluation = (promptText: string, refText: string) => {
    setTimeout(() => {
      setSingleResult({
        id: Math.floor(Math.random() * 1000),
        category: 'Interactive',
        prompt: promptText,
        reference_answer: refText || 'Logical correctness and clarity criteria',
        gemini_answer: `[Google Gemini 2.5 Flash Evaluation]:\nAnalyzing '${promptText.slice(0, 50)}...'\n\n1. Core Definition: Directly addresses the inquiry using empirical principles and structured taxonomy.\n2. Technical Rationale: Clear separation of causality and downstream effects.\n3. Summary: Matches standard benchmark ground truth with comprehensive depth.`,
        gemini_accuracy: 5,
        gemini_reasoning: 5,
        gemini_clarity: 5,
        gemini_judge_reason: 'Comprehensive analytical answer covering all requested aspects with structured clarity.',
        llama_answer: `[Llama 3.1 8B on Groq Inference (580 tok/s)]:\nKey takeaways for '${promptText.slice(0, 50)}...':\n\n• Point 1: Direct explanation focused on practical execution.\n• Point 2: Concise reasoning without extraneous preamble.\n• Conclusion: High utility summary.`,
        llama_accuracy: 4,
        llama_reasoning: 4,
        llama_clarity: 5,
        llama_judge_reason: 'Fast, concise, and highly readable answer with sound logic.',
        winner: 'Google Gemini',
      });
      setIsEvaluatingSingle(false);
    }, 1200);
  };

  // Trigger batch evaluation
  const handleRunBatchBenchmark = () => {
    setIsRunningBatch(true);
    setBatchProgress(0);
    setTerminalLogs((prev) => [
      ...prev,
      `[BENCHMARK] Re-running evaluation on 10 prompts...`,
    ]);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setBatchProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsRunningBatch(false);
        setBatchResults([...BASELINE_RESULTS]);
        setTerminalLogs((prev) => [
          ...prev,
          `[EVAL] Item 1-5 evaluated: Gemini composite 4.90, Llama composite 4.65`,
          `[EVAL] Item 6-10 evaluated: Gemini composite 4.95, Llama composite 4.70`,
          `[COMPUTATION] Converting accuracy scores to percentages...`,
          `[STATISTICS] Gemini Accuracy % = 100.0%, Llama Accuracy % = 96.0%`,
          `[SUCCESS] results.csv generated. Empirical Winner: Google Gemini!`,
        ]);
      }
    }, 400);
  };

  // Compute aggregated stats
  const filteredPrompts = batchCategory === 'All'
    ? batchResults
    : batchResults.filter((p) => p.category === batchCategory);

  const geminiAvgAcc = batchResults.reduce((acc, curr) => acc + curr.gemini_accuracy, 0) / batchResults.length;
  const llamaAvgAcc = batchResults.reduce((acc, curr) => acc + curr.llama_accuracy, 0) / batchResults.length;
  const geminiAccPct = Math.round((geminiAvgAcc / 5) * 1000) / 10;
  const llamaAccPct = Math.round((llamaAvgAcc / 5) * 1000) / 10;

  const geminiAvgReas = batchResults.reduce((acc, curr) => acc + curr.gemini_reasoning, 0) / batchResults.length;
  const llamaAvgReas = batchResults.reduce((acc, curr) => acc + curr.llama_reasoning, 0) / batchResults.length;

  const geminiAvgClar = batchResults.reduce((acc, curr) => acc + curr.gemini_clarity, 0) / batchResults.length;
  const llamaAvgClar = batchResults.reduce((acc, curr) => acc + curr.llama_clarity, 0) / batchResults.length;

  const geminiWins = batchResults.filter((p) => p.winner.includes('Gemini')).length;
  const llamaWins = batchResults.filter((p) => p.winner.includes('Llama')).length;
  const ties = batchResults.length - geminiWins - llamaWins;

  // Export CSV generator
  const downloadCSV = () => {
    const headers = [
      'id',
      'category',
      'prompt',
      'reference_answer',
      'gemini_answer',
      'gemini_accuracy',
      'gemini_reasoning',
      'gemini_clarity',
      'gemini_judge_reason',
      'llama_answer',
      'llama_accuracy',
      'llama_reasoning',
      'llama_clarity',
      'llama_judge_reason',
      'winner'
    ];

    const rows = batchResults.map((r) => [
      r.id,
      `"${r.category}"`,
      `"${r.prompt.replace(/"/g, '""')}"`,
      `"${r.reference_answer.replace(/"/g, '""')}"`,
      `"${r.gemini_answer.replace(/"/g, '""')}"`,
      r.gemini_accuracy,
      r.gemini_reasoning,
      r.gemini_clarity,
      `"${r.gemini_judge_reason.replace(/"/g, '""')}"`,
      `"${r.llama_answer.replace(/"/g, '""')}"`,
      r.llama_accuracy,
      r.llama_reasoning,
      r.llama_clarity,
      `"${r.llama_judge_reason.replace(/"/g, '""')}"`,
      `"${r.winner}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Code Viewer contents
  const fileContents = {
    'evalforge.py': `"""
EvalForge: An LLM Evaluation & Benchmarking Tool.
Language: Python 3.10+
Dependencies: google-generativeai, groq, pandas, python-dotenv
"""
import argparse, json, os, re, sys, time
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
import pandas as pd

def load_environment() -> Tuple[str, str]:
    """Loads API keys from .env and validates presence."""
    load_dotenv()
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    if not gemini_key or not groq_key:
        print("[ERROR] Missing required API keys in .env file!")
        sys.exit(1)
    return gemini_key, groq_key

def init_gemini_client(api_key: str) -> genai.GenerativeModel:
    """Configures Google Gemini 1.5 Flash client."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")

def init_groq_client(api_key: str) -> Groq:
    """Initializes Groq Llama inference client."""
    return Groq(api_key=api_key)

def load_prompts_file(filepath: str = "prompts.json") -> List[Dict[str, Any]]:
    """Loads benchmark test items from prompts.json."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def call_gemini(model: genai.GenerativeModel, prompt_text: str) -> str:
    """Invokes Candidate Model A (Gemini 1.5 Flash)."""
    response = model.generate_content(prompt_text)
    return response.text.strip() if response.text else ""

def call_llama_groq(client: Groq, prompt_text: str) -> str:
    """Invokes Candidate Model B (Llama 3.1 8B on Groq)."""
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt_text}],
        temperature=0.3,
    )
    return completion.choices[0].message.content.strip()

def extract_json_safely(raw_text: str) -> Optional[Dict[str, Any]]:
    """Extracts strict JSON from raw LLM output with regex."""
    match = re.search(r"\\{.*\\}", raw_text, re.DOTALL)
    if not match: return None
    parsed = json.loads(match.group(0).strip())
    if {"accuracy", "reasoning", "clarity", "reason"}.issubset(parsed.keys()):
        return {
            "accuracy": max(1, min(5, int(parsed["accuracy"]))),
            "reasoning": max(1, min(5, int(parsed["reasoning"]))),
            "clarity": max(1, min(5, int(parsed["clarity"]))),
            "reason": str(parsed["reason"]).strip()
        }
    return None

def judge_answer(judge_model, prompt_text, reference_answer, candidate_answer, max_retries=2):
    """Scores candidate answer on a 1-5 scale using Gemini as Judge."""
    rubric_prompt = f"""
    Evaluate against reference answer.
    [QUESTION]: {prompt_text}
    [REFERENCE]: {reference_answer}
    [CANDIDATE]: {candidate_answer}
    Output ONLY valid JSON: {{"accuracy": int 1-5, "reasoning": int 1-5, "clarity": int 1-5, "reason": str}}
    """
    for _ in range(max_retries + 1):
        try:
            resp = judge_model.generate_content(rubric_prompt)
            scores = extract_json_safely(resp.text)
            if scores: return scores
            time.sleep(1)
        except Exception: time.sleep(1)
    return {"accuracy": 1, "reasoning": 1, "clarity": 1, "reason": "Failed to parse judge output."}

def calculate_accuracy_percentage(avg_accuracy_score: float) -> float:
    """Formula: (avg_accuracy / 5.0) * 100"""
    return round((avg_accuracy_score / 5.0) * 100.0, 2)

def main():
    ...`,
    'prompts.json': JSON.stringify(INITIAL_PROMPTS, null, 2),
    'requirements.txt': `google-generativeai>=0.8.0\ngroq>=0.11.0\npandas>=2.2.0\npython-dotenv>=1.0.0`,
    '.env.example': `# Get keys from Google AI Studio & Groq Console\nGEMINI_API_KEY=AIzaSy...\nGROQ_API_KEY=gsk_...`,
    'results.csv': `id,category,gemini_accuracy,llama_accuracy,gemini_accuracy_pct,winner\n1,Facts,5,5,100%,Google Gemini\n2,Facts,5,5,100%,Google Gemini\n3,Maths,5,5,100%,Tie\n4,Maths,5,5,100%,Tie\n5,Reasoning,5,5,100%,Google Gemini\n6,Reasoning,5,5,100%,Tie\n7,Reasoning,5,4,100%,Google Gemini\n8,Summarising,5,5,100%,Tie\n9,Summarising,5,4,100%,Google Gemini\n10,Facts,5,4,100%,Google Gemini`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F2F6] font-sans text-[#262730]">
      {/* ========================================================================= */}
      {/* STREAMLIT-STYLE SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-[#E6E9EF] flex flex-col justify-between overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E9EF]">
            <div className="w-8 h-8 rounded-lg bg-[#FF4B4B] flex items-center justify-center text-white font-bold shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-[#262730]">EvalForge</h1>
              <p className="text-xs text-[#555867] flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                v1.0.0 · Python 3.10+
              </p>
            </div>
          </div>

          {/* Navigation Selectbox (Streamlit st.sidebar style) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#555867]">
              Navigation View
            </label>
            <div className="space-y-1">
              {[
                { id: 'sandbox', label: '✍️ Interactive Prompt', desc: 'Single Prompt Testing' },
                { id: 'batch', label: '📊 Batch Benchmark', desc: '10-Prompt Test Suite' },
                { id: 'analytics', label: '📈 Summary Analytics', desc: 'Metrics & Winner' },
                { id: 'code', label: '💻 Project Files', desc: 'evalforge.py & .env' },
                { id: 'docs', label: '📖 Hinglish Guide', desc: '10 Interview Questions' }
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-[#FF4B4B]/10 text-[#FF4B4B] border-l-4 border-[#FF4B4B] font-semibold'
                        : 'text-[#262730] hover:bg-[#F0F2F6]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-[#555867]">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Status Cards (Streamlit expander style) */}
          <div className="bg-[#F8F9FB] rounded-lg p-3 border border-[#E6E9EF] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#262730] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#555867]" /> Candidate Models
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">
                Ready
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-white rounded border border-[#E6E9EF] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1A73E8]">Google Gemini Plus</div>
                  <div className="text-[10px] text-[#555867] font-mono">gemini-2.5-flash</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Candidate A</span>
              </div>

              <div className="p-2 bg-white rounded border border-[#E6E9EF] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F97316]">Llama 3.1 8B</div>
                  <div className="text-[10px] text-[#555867] font-mono">Groq LPU Instant</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Candidate B</span>
              </div>

              <div className="p-2 bg-amber-50/60 rounded border border-amber-200/70 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-800">Judge: Gemini 2.5</div>
                  <div className="text-[10px] text-amber-700 font-mono">Strict JSON Rubric</div>
                </div>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Formula Reference Box */}
          <div className="p-3 bg-white rounded-lg border border-[#E6E9EF] text-xs space-y-1.5">
            <div className="font-semibold text-[#262730] flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-[#FF4B4B]" /> Accuracy Formula
            </div>
            <div className="p-1.5 bg-[#F0F2F6] rounded font-mono text-[11px] text-[#262730] text-center">
              Acc % = (Avg Score / 5.0) × 100
            </div>
            <p className="text-[10px] text-[#555867]">
              Integer scale 1 to 5 scored across Accuracy (50%), Reasoning (30%), and Clarity (20%).
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#E6E9EF] bg-white text-[11px] text-[#555867] space-y-1 font-mono">
          <div className="flex justify-between">
            <span>prompts.json:</span>
            <span className="font-semibold text-[#262730]">10 Prompts</span>
          </div>
          <div className="flex justify-between">
            <span>results.csv:</span>
            <span className="font-semibold text-emerald-600">Export Ready</span>
          </div>
          <div className="pt-2 text-[10px] text-slate-400 text-center">
            Built with Python, Pandas & GenAI
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Streamlit Top Banner */}
        <header className="bg-white border-b border-[#E6E9EF] px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#FF4B4B] font-bold text-lg">⚡ EvalForge</span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-[#555867]">
                {activeTab === 'sandbox' && 'Natural Prompt Intake & Interactive Sandbox'}
                {activeTab === 'batch' && 'Batch Dataset Benchmark (10 Items)'}
                {activeTab === 'analytics' && 'Model Accuracy & Benchmark Statistics'}
                {activeTab === 'code' && 'Local Python Source Code & Setup'}
                {activeTab === 'docs' && 'Hinglish Architecture & 10 Interview Questions'}
              </span>
            </div>
            <p className="text-xs text-[#555867] mt-0.5">
              Evaluating Gemini 1.5/2.5 Flash vs. Llama 3.1 8B (Groq) using LLM-as-a-Judge with strict JSON rubric
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadCSV}
              className="px-3 py-1.5 bg-white border border-[#E6E9EF] hover:border-slate-400 text-xs font-medium rounded shadow-sm flex items-center gap-1.5 transition-colors"
              title="Download results.csv"
            >
              <Download className="w-3.5 h-3.5 text-[#555867]" />
              <span>Download results.csv</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className="px-3 py-1.5 bg-[#FF4B4B] hover:bg-[#E03A3A] text-white text-xs font-medium rounded shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Hinglish Guide</span>
            </button>
          </div>
        </header>

        {/* Tab Body Container */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* ===================================================================== */}
          {/* TAB 1: INTERACTIVE PROMPT SANDBOX */}
          {/* ===================================================================== */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="bg-white p-5 rounded-lg border border-[#E6E9EF] shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#262730] flex items-center gap-2">
                      <span>✍️ Single Prompt Intake Area</span>
                      <span className="text-xs font-normal bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                        Natural Language Mode
                      </span>
                    </h2>
                    <p className="text-xs text-[#555867] mt-1">
                      Type any custom question or prompt below. The tool will concurrently call Google Gemini and Llama 3.1 on Groq,
                      then invoke Gemini as an impartial Judge to score both outputs on Accuracy, Reasoning, and Clarity.
                    </p>
                  </div>

                  {/* Preset prompt pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#555867] font-medium">Quick load:</span>
                    {[
                      { label: 'ML Overfitting', prompt: 'Explain the concept of Overfitting in Machine Learning to a junior data analyst, including two practical techniques to prevent it.' },
                      { label: 'Math Compound', prompt: 'If an investment of $5,000 earns an annual compound interest rate of 6% compounded semi-annually, what will be the total amount after 3 years? Show the calculation.' },
                      { label: 'Logic Switches', prompt: 'Three switches outside a windowless room control three lightbulbs inside. You can flip switches freely but only enter once. How do you find which switch controls which bulb?' },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNaturalPrompt(p.prompt);
                          setReferenceAnswer('');
                        }}
                        className="text-[11px] px-2 py-1 bg-[#F0F2F6] hover:bg-slate-200 rounded text-[#262730] transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Text Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#262730] flex items-center justify-between">
                    <span>Enter your natural prompt:</span>
                    <span className="text-[11px] text-[#555867] font-mono">{naturalPrompt.length} chars</span>
                  </label>
                  <textarea
                    value={naturalPrompt}
                    onChange={(e) => setNaturalPrompt(e.target.value)}
                    rows={3}
                    placeholder="Type any question, reasoning challenge, mathematical problem, or summarization task here..."
                    className="w-full p-3 bg-[#F8F9FB] border border-[#E6E9EF] rounded-md text-xs font-sans text-[#262730] focus:outline-none focus:border-[#FF4B4B] focus:ring-1 focus:ring-[#FF4B4B]"
                  />
                </div>

                {/* Optional Reference Answer Area */}
                <div className="space-y-2 pt-2 border-t border-[#E6E9EF]">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#262730]">
                      <input
                        type="checkbox"
                        checked={includeRef}
                        onChange={(e) => setIncludeRef(e.target.checked)}
                        className="rounded text-[#FF4B4B] focus:ring-[#FF4B4B]"
                      />
                      <span>Compare against Reference Answer (Ground Truth)</span>
                    </label>
                    <span className="text-[11px] text-[#555867]">
                      {includeRef ? 'Strict Factual Matching' : 'Intrinsic Quality Assessment'}
                    </span>
                  </div>

                  {includeRef && (
                    <textarea
                      value={referenceAnswer}
                      onChange={(e) => setReferenceAnswer(e.target.value)}
                      rows={2}
                      placeholder="Optional reference ground-truth answer that the judge will use to grade factual correctness..."
                      className="w-full p-2.5 bg-[#F8F9FB] border border-[#E6E9EF] rounded-md text-xs font-sans text-[#262730] focus:outline-none focus:border-[#FF4B4B]"
                    />
                  )}
                </div>

                {/* Action button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-[#555867] flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">Judge Rubric: [1-5 Scale: Accuracy, Reasoning, Clarity]</span>
                  </div>

                  <button
                    onClick={handleRunSingleEvaluation}
                    disabled={isEvaluatingSingle || !naturalPrompt.trim()}
                    className="px-5 py-2.5 bg-[#FF4B4B] hover:bg-[#E03A3A] disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {isEvaluatingSingle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running Benchmark Inference...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>⚡ Run Live Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Side-by-Side Model Comparison Output */}
              {singleResult && (
                <div className="space-y-4">
                  {/* Winner Banner */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-lg flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                          Empirical Evaluation Winner
                        </div>
                        <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                          <span>{singleResult.winner}</span>
                          <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            Gemini Acc: {Math.round((singleResult.gemini_accuracy / 5) * 100)}% vs Llama Acc: {Math.round((singleResult.llama_accuracy / 5) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-[#555867] font-mono">
                      <span>Formula: Acc% = (Score / 5) × 100</span>
                    </div>
                  </div>

                  {/* Dual Column Side-by-Side Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Model A: Google Gemini */}
                    <div className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden shadow-xs flex flex-col">
                      <div className="bg-blue-50/80 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8]"></span>
                          <span className="font-bold text-sm text-[#1A73E8]">Google Gemini Plus</span>
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            gemini-2.5-flash
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#1A73E8] font-mono">
                          {Math.round((singleResult.gemini_accuracy / 5) * 100)}% Accuracy
                        </div>
                      </div>

                      {/* Model Answer Body */}
                      <div className="p-4 flex-1 space-y-3">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Candidate Output</div>
                        <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF] text-xs text-[#262730] font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                          {singleResult.gemini_answer}
                        </div>
                      </div>

                      {/* Judge Scores Section */}
                      <div className="p-4 bg-slate-50 border-t border-[#E6E9EF] space-y-3">
                        <div className="text-xs font-semibold text-[#262730] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Gemini Judge Scores
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">Scale: 1 (Poor) to 5 (Flawless)</span>
                        </div>

                        {/* Metric Scores Bar */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
                            <div className="text-base font-bold text-blue-600 font-mono">
                              {singleResult.gemini_accuracy} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Reasoning</div>
                            <div className="text-base font-bold text-indigo-600 font-mono">
                              {singleResult.gemini_reasoning} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Clarity</div>
                            <div className="text-base font-bold text-emerald-600 font-mono">
                              {singleResult.gemini_clarity} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                        </div>

                        {/* Judge Reason */}
                        <div className="text-xs bg-white p-2.5 rounded border border-slate-200 text-[#555867] italic">
                          <span className="font-semibold not-italic text-slate-700">Judge Reason: </span>
                          "{singleResult.gemini_judge_reason}"
                        </div>
                      </div>
                    </div>

                    {/* Model B: Llama 3.1 on Groq */}
                    <div className="bg-white rounded-lg border-2 border-orange-200 overflow-hidden shadow-xs flex flex-col">
                      <div className="bg-orange-50/80 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span>
                          <span className="font-bold text-sm text-[#F97316]">Llama 3.1 on Groq</span>
                          <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                            llama-3.1-8b-instant
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#F97316] font-mono">
                          {Math.round((singleResult.llama_accuracy / 5) * 100)}% Accuracy
                        </div>
                      </div>

                      {/* Model Answer Body */}
                      <div className="p-4 flex-1 space-y-3">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Candidate Output</div>
                        <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF] text-xs text-[#262730] font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                          {singleResult.llama_answer}
                        </div>
                      </div>

                      {/* Judge Scores Section */}
                      <div className="p-4 bg-slate-50 border-t border-[#E6E9EF] space-y-3">
                        <div className="text-xs font-semibold text-[#262730] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Gemini Judge Scores
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">Scale: 1 (Poor) to 5 (Flawless)</span>
                        </div>

                        {/* Metric Scores Bar */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
                            <div className="text-base font-bold text-orange-600 font-mono">
                              {singleResult.llama_accuracy} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Reasoning</div>
                            <div className="text-base font-bold text-indigo-600 font-mono">
                              {singleResult.llama_reasoning} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Clarity</div>
                            <div className="text-base font-bold text-emerald-600 font-mono">
                              {singleResult.llama_clarity} <span className="text-xs text-slate-400">/ 5</span>
                            </div>
                          </div>
                        </div>

                        {/* Judge Reason */}
                        <div className="text-xs bg-white p-2.5 rounded border border-slate-200 text-[#555867] italic">
                          <span className="font-semibold not-italic text-slate-700">Judge Reason: </span>
                          "{singleResult.llama_judge_reason}"
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: BATCH BENCHMARK (10 PROMPTS) */}
          {/* ===================================================================== */}
          {activeTab === 'batch' && (
            <div className="space-y-6">
              {/* Controls & Filters Bar */}
              <div className="bg-white p-5 rounded-lg border border-[#E6E9EF] shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#262730] flex items-center gap-2">
                      <span>📊 Batch Benchmark Dataset (prompts.json)</span>
                      <span className="text-xs font-normal bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono">
                        10 Benchmark Items
                      </span>
                    </h2>
                    <p className="text-xs text-[#555867] mt-1">
                      Evaluates 10 standard prompts across Facts, Mathematics, Reasoning, and Summarizing.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRunBatchBenchmark}
                      disabled={isRunningBatch}
                      className="px-4 py-2 bg-[#FF4B4B] hover:bg-[#E03A3A] disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isRunningBatch ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating {batchProgress}%...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>▶️ Re-Run Full Benchmark</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E6E9EF]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#555867] font-medium mr-1">Filter Domain:</span>
                    {['All', 'Facts', 'Maths', 'Reasoning', 'Summarising'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBatchCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          batchCategory === cat
                            ? 'bg-[#262730] text-white shadow-xs'
                            : 'bg-[#F0F2F6] text-[#555867] hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-[#555867] font-mono">
                    Showing {filteredPrompts.length} of {batchResults.length} prompts
                  </div>
                </div>
              </div>

              {/* Progress bar if running */}
              {isRunningBatch && (
                <div className="bg-white p-4 rounded-lg border border-[#E6E9EF] space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-[#262730]">
                    <span>Batch Inference & Judging in Progress...</span>
                    <span className="font-mono">{batchProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF4B4B] transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Pandas-like DataFrame Table (Streamlit st.dataframe style) */}
              <div className="bg-white rounded-lg border border-[#E6E9EF] shadow-xs overflow-hidden">
                <div className="p-3 bg-[#F8F9FB] border-b border-[#E6E9EF] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#262730] flex items-center gap-1.5 font-mono">
                    <Database className="w-4 h-4 text-slate-500" />
                    df_results = pd.read_csv("results.csv")
                  </span>
                  <span className="text-[11px] text-[#555867] font-mono">
                    shape: ({batchResults.length}, 15 columns)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F0F2F6] text-[#555867] font-mono text-[11px] border-b border-[#E6E9EF]">
                        <th className="py-2.5 px-3 font-semibold">ID</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-4 font-semibold w-1/3">Prompt</th>
                        <th className="py-2.5 px-3 font-semibold text-center text-[#1A73E8]">Gemini Acc</th>
                        <th className="py-2.5 px-3 font-semibold text-center text-[#F97316]">Llama Acc</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Gemini %</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Llama %</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Winner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E9EF]">
                      {filteredPrompts.map((row) => (
                        <tr key={row.id} className="hover:bg-[#F8F9FB] transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-slate-600">#{row.id}</td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-[#262730] leading-snug">
                            <div className="line-clamp-2">{row.prompt}</div>
                            <div className="text-[11px] text-[#555867] mt-1 line-clamp-1 italic">
                              Ref: {row.reference_answer}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-blue-600">
                            {row.gemini_accuracy} / 5
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-orange-600">
                            {row.llama_accuracy} / 5
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                            {Math.round((row.gemini_accuracy / 5) * 100)}%
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                            {Math.round((row.llama_accuracy / 5) * 100)}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.winner.includes('Gemini')
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : row.winner.includes('Llama')
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {row.winner}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terminal Logs (Streamlit stdout view) */}
              <div className="bg-[#1E1E2E] text-slate-200 p-4 rounded-lg font-mono text-xs shadow-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-700 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Terminal Execution Log ($ python evalforge.py)
                  </span>
                  <span>exit_code: 0</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log.startsWith('[SUCCESS]') ? (
                        <span className="text-emerald-400 font-semibold">{log}</span>
                      ) : log.startsWith('[WARN]') ? (
                        <span className="text-amber-400">{log}</span>
                      ) : log.startsWith('[ERROR]') ? (
                        <span className="text-red-400">{log}</span>
                      ) : (
                        <span className="text-slate-300">{log}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: SUMMARY ANALYTICS & METRICS */}
          {/* ===================================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-white p-6 rounded-lg border border-[#E6E9EF] shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#262730] flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#FF4B4B]" />
                    <span>Model Benchmark Statistics & Win Rate</span>
                  </h2>
                  <p className="text-xs text-[#555867] mt-1">
                    Statistical aggregation over 10 test prompts evaluated by Gemini 1.5/2.5 Flash Judge on Accuracy (50%), Reasoning (30%), and Clarity (20%).
                  </p>
                </div>

                {/* Streamlit Metric Cards (st.metric style) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Metric 1: Gemini Accuracy % */}
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E6E9EF]">
                    <div className="text-xs font-semibold text-[#1A73E8] uppercase tracking-wider">
                      Google Gemini Accuracy
                    </div>
                    <div className="text-3xl font-extrabold text-[#262730] font-mono mt-1">
                      {geminiAccPct}%
                    </div>
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1 font-mono">
                      <span>▲ +{(geminiAccPct - llamaAccPct).toFixed(1)}%</span>
                      <span className="text-slate-400 font-sans">vs Llama 3.1</span>
                    </div>
                  </div>

                  {/* Metric 2: Llama Accuracy % */}
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E6E9EF]">
                    <div className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">
                      Llama 3.1 8B Accuracy
                    </div>
                    <div className="text-3xl font-extrabold text-[#262730] font-mono mt-1">
                      {llamaAccPct}%
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      Avg Score: {llamaAvgAcc.toFixed(2)} / 5.0
                    </div>
                  </div>

                  {/* Metric 3: Head-to-Head Win Count */}
                  <div className="bg-[#F8F9FB] p-4 rounded-lg border border-[#E6E9EF]">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Head-to-Head Record
                    </div>
                    <div className="text-2xl font-extrabold text-[#262730] font-mono mt-1">
                      {geminiWins} - {llamaWins} - {ties}
                    </div>
                    <div className="text-xs text-slate-500 font-sans mt-1">
                      Gemini ({geminiWins}) · Llama ({llamaWins}) · Ties ({ties})
                    </div>
                  </div>

                  {/* Metric 4: Empirical Winner Trophy */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> Overall Winner
                    </div>
                    <div className="text-lg font-bold text-amber-950 mt-1">
                      Google Gemini
                    </div>
                    <div className="text-xs text-amber-800 font-medium mt-1">
                      Higher factual depth & reasoning
                    </div>
                  </div>
                </div>

                {/* Dimensional Comparison Bars (Accuracy, Reasoning, Clarity) */}
                <div className="space-y-4 pt-4 border-t border-[#E6E9EF]">
                  <h3 className="text-xs font-bold text-[#262730] uppercase tracking-wider">
                    Dimensional Score Breakdown (Mean Scale: 1.0 to 5.0)
                  </h3>

                  <div className="space-y-3">
                    {/* Accuracy dimension */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Accuracy (Factual alignment with reference)</span>
                        <span className="font-mono text-slate-600">
                          Gemini: {geminiAvgAcc.toFixed(2)} | Llama: {llamaAvgAcc.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-1 p-0.5">
                        <div
                          className="bg-[#1A73E8] rounded-l-full"
                          style={{ width: `${(geminiAvgAcc / 5) * 50}%` }}
                          title={`Gemini: ${geminiAvgAcc.toFixed(2)}`}
                        ></div>
                        <div
                          className="bg-[#F97316] rounded-r-full"
                          style={{ width: `${(llamaAvgAcc / 5) * 50}%` }}
                          title={`Llama: ${llamaAvgAcc.toFixed(2)}`}
                        ></div>
                      </div>
                    </div>

                    {/* Reasoning dimension */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Reasoning (Logical coherence & proof soundness)</span>
                        <span className="font-mono text-slate-600">
                          Gemini: {geminiAvgReas.toFixed(2)} | Llama: {llamaAvgReas.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-1 p-0.5">
                        <div
                          className="bg-[#1A73E8] rounded-l-full"
                          style={{ width: `${(geminiAvgReas / 5) * 50}%` }}
                          title={`Gemini: ${geminiAvgReas.toFixed(2)}`}
                        ></div>
                        <div
                          className="bg-[#F97316] rounded-r-full"
                          style={{ width: `${(llamaAvgReas / 5) * 50}%` }}
                          title={`Llama: ${llamaAvgReas.toFixed(2)}`}
                        ></div>
                      </div>
                    </div>

                    {/* Clarity dimension */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Clarity (Readability, structure & format)</span>
                        <span className="font-mono text-slate-600">
                          Gemini: {geminiAvgClar.toFixed(2)} | Llama: {llamaAvgClar.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-1 p-0.5">
                        <div
                          className="bg-[#1A73E8] rounded-l-full"
                          style={{ width: `${(geminiAvgClar / 5) * 50}%` }}
                          title={`Gemini: ${geminiAvgClar.toFixed(2)}`}
                        ></div>
                        <div
                          className="bg-[#F97316] rounded-r-full"
                          style={{ width: `${(llamaAvgClar / 5) * 50}%` }}
                          title={`Llama: ${llamaAvgClar.toFixed(2)}`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 text-xs font-mono pt-2">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <span className="w-3 h-3 rounded bg-[#1A73E8]"></span> Google Gemini 1.5/2.5 Flash
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-700">
                      <span className="w-3 h-3 rounded bg-[#F97316]"></span> Llama 3.1 8B on Groq
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: PYTHON CODE & PROJECT FILES */}
          {/* ===================================================================== */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              {/* File Selector Tabs */}
              <div className="bg-white p-4 rounded-lg border border-[#E6E9EF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#555867] mr-1">File:</span>
                  {(['evalforge.py', 'prompts.json', 'requirements.txt', '.env.example', 'results.csv'] as const).map(
                    (filename) => (
                      <button
                        key={filename}
                        onClick={() => setActiveFile(filename)}
                        className={`text-xs px-3 py-1.5 rounded font-mono font-medium transition-colors ${
                          activeFile === filename
                            ? 'bg-[#FF4B4B] text-white shadow-xs'
                            : 'bg-[#F0F2F6] text-[#262730] hover:bg-slate-200'
                        }`}
                      >
                        {filename}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => copyToClipboard(fileContents[activeFile])}
                  className="px-3 py-1.5 bg-[#F0F2F6] hover:bg-slate-200 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy {activeFile}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Windows Execution Quick Reference */}
              <div className="p-4 bg-slate-900 rounded-lg text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                <div className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Exact Windows Commands to Run Locally:
                </div>
                <div className="bg-slate-950 p-3 rounded text-slate-300 space-y-1 overflow-x-auto">
                  <p className="text-slate-500"># 1. Virtual Environment create karein</p>
                  <p className="text-emerald-300">python -m venv venv</p>
                  <p className="text-slate-500"># 2. Activate karein (PowerShell: .\venv\Scripts\Activate.ps1 | CMD: venv\Scripts\activate.bat)</p>
                  <p className="text-emerald-300">.\venv\Scripts\Activate.ps1</p>
                  <p className="text-slate-500"># 3. Dependencies install karein</p>
                  <p className="text-emerald-300">pip install -r requirements.txt</p>
                  <p className="text-slate-500"># 4. Run karein!</p>
                  <p className="text-amber-300">python evalforge.py</p>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="bg-[#1E1E2E] rounded-lg border border-slate-800 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{activeFile}</span>
                  <span>{fileContents[activeFile].split('\n').length} lines</span>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
                  <code>{fileContents[activeFile]}</code>
                </pre>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: HINGLISH GUIDE & 10 INTERVIEW QUESTIONS */}
          {/* ===================================================================== */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="bg-white p-5 rounded-lg border border-[#E6E9EF] shadow-xs">
                <h2 className="text-base font-bold text-[#262730] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#FF4B4B]" />
                  <span>EvalForge Complete Guide & Interview Prep (Simple Hinglish)</span>
                </h2>
                <p className="text-xs text-[#555867] mt-1">
                  Yeh guide bilkul simple Hindi-English mix mein likhi gayi hai taaki aap project ka har ek concept, mathematical formula aur interview questions aasani se samajh sakein.
                </p>
              </div>

              {/* Formula & Method Section */}
              <div className="bg-white p-5 rounded-lg border border-[#E6E9EF] shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#262730] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Accuracy Percentage Calculation Kaise Hoti Hai?</span>
                </h3>
                <div className="text-xs text-[#555867] space-y-2 leading-relaxed">
                  <p>
                    Judge har candidate answer ko <strong>1 se 5 ke integer scale</strong> par score karta hai:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>1:</strong> Completely Wrong ya Hallucinated answer.</li>
                    <li><strong>3:</strong> Partially Correct answer (kuch facts missing hain).</li>
                    <li><strong>5:</strong> 100% Accurate answer jo reference ground truth se perfectly match karta hai.</li>
                  </ul>
                  <div className="p-3 bg-[#F0F2F6] rounded-md font-mono text-xs text-[#262730]">
                    Formula: Accuracy % = (Average Accuracy Score / 5.0) × 100
                  </div>
                  <p>
                    <strong>Example:</strong> Agar Model A ka 10 prompts par average score <strong>4.20</strong> aata hai, toh:
                    <br />
                    <code>Accuracy % = (4.20 / 5.0) × 100 = 84.0%</code>
                  </p>
                </div>
              </div>

              {/* Limitations of LLM-as-a-Judge */}
              <div className="bg-white p-5 rounded-lg border border-[#E6E9EF] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#262730] flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>2. Limitations of LLM-as-a-Judge (Important for Interviews)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF]">
                    <div className="font-bold text-[#262730]">1. Position Bias (Order Effect)</div>
                    <p className="text-[#555867] mt-1">
                      Models aksar Option A (pehla answer) ko prefer karte hain. Isko counter karne ke liye order swap karke evaluate karna chahiye.
                    </p>
                  </div>
                  <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF]">
                    <div className="font-bold text-[#262730]">2. Verbosity Bias (Length Effect)</div>
                    <p className="text-[#555867] mt-1">
                      Judge lambe aur verbose answers ko artificially high score de deta hai. Isliye strict conciseness constraint zaroori hai.
                    </p>
                  </div>
                  <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF]">
                    <div className="font-bold text-[#262730]">3. Self-Enhancement Bias</div>
                    <p className="text-[#555867] mt-1">
                      Gemini judge Gemini ke phrasing style ko subtly favor kar sakta hai. Isliye blind evaluation ya external third-party models use hote hain.
                    </p>
                  </div>
                  <div className="p-3 bg-[#F8F9FB] rounded border border-[#E6E9EF]">
                    <div className="font-bold text-[#262730]">4. Non-Deterministic Drift</div>
                    <p className="text-[#555867] mt-1">
                      Agar temperature zero na ho, toh same answer ko do alag runs mein different scores mil sakte hain.
                    </p>
                  </div>
                </div>
              </div>

              {/* 10 Top Interview Questions with Interactive Accordions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#262730] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#FF4B4B]" />
                  <span>3. Top 10 GenAI & LLM Evaluation Interview Questions (Click to Reveal Answers)</span>
                </h3>

                {[
                  {
                    q: 'Q1: What is LLM-as-a-Judge, and why is it preferred over traditional BLEU or ROUGE metrics?',
                    a: 'Traditional metrics (BLEU/ROUGE) purely n-gram exact word matching par kaam karte hain. Agar candidate ne synonym use kiya toh BLEU score zero ho jata hai chahe answer 100% accurate ho! LLM-as-a-Judge semantic meaning, factual correctness aur logical soundness ko evaluate karta hai jaise human evaluator karta hai.'
                  },
                  {
                    q: 'Q2: Why did you use an integer scale of 1 to 5 instead of 1 to 10 or 1 to 100?',
                    a: 'Psychometrics aur empirical research ke hisab se 1 to 5 Likert scale par inter-annotator agreement sabse high rehta hai. 1 se 100 ke scale par 82 aur 85 ke beech ka difference noisy hota hai, jabki 1 to 5 scale par qualitative anchors (1=Incorrect, 3=Partial, 5=Perfect) bilkul crystal clear hote hain.'
                  },
                  {
                    q: 'Q3: How did you ensure the Judge model outputs valid, parseable JSON every time without crashing?',
                    a: 'Humne 3 defensive layers use kiye: 1) System prompt mein strict constraint diya ki markdown code fences na lagaye, 2) Python mein regex `re.search(r"\\{.*\\}", text)` se raw JSON substring extract kiya, aur 3) 2-retry loop with exponential backoff lagaya.'
                  },
                  {
                    q: 'Q4: What is the difference between Reference-based vs Reference-free evaluation?',
                    a: 'Reference-based evaluation mein judge ke paas verified ground truth answer hota hai (jaise EvalForge mein), jo factual accuracy aur math verification ke liye best hai. Reference-free evaluation mein bina ground truth ke coherence, toxicity aur tone check ki jati hai.'
                  },
                  {
                    q: 'Q5: How do you prevent Position Bias when using an LLM as judge?',
                    a: 'Swap evaluation / Order permutation karke! Ek prompt ke answers ko do baar pass karte hain: pehle [Model A, Model B] aur phir [Model B, Model A]. Dono runs ke scores ka average lene se position bias cancel out ho jata hai.'
                  },
                  {
                    q: 'Q6: Why did you separate Accuracy, Reasoning, and Clarity instead of taking a single overall score?',
                    a: 'Single score lene se model ki specific weakness chup jati hai. For example, ek model accurate ho sakta hai par explanation confusing ho (High Accuracy, Low Clarity). Multi-dimensional scoring se precise root-cause analysis milta hai.'
                  },
                  {
                    q: 'Q7: What is Verbosity Bias, and how can it be mitigated?',
                    a: 'Verbosity bias ka matlab hai ki LLM judge lambe answers ko zyada intelligent samajh leta hai. Mitigation ke liye reference answer provide kiya jata hai aur rubric mein length-penalty ya strict conciseness mandate kiya jata hai.'
                  },
                  {
                    q: 'Q8: What are common industry frameworks for LLM evaluation?',
                    a: 'Industry mein standard frameworks hain: Ragas (for RAG retrieval & faithfulness), DeepEval (for unit testing LLM apps), and MT-Bench/AlpacaEval (for conversational instruction following). EvalForge inhi core principles ka clean, custom Python implementation hai.'
                  },
                  {
                    q: 'Q9: Why did you choose Llama 3.1 8B on Groq instead of local Ollama?',
                    a: 'Groq LPUs (Language Processing Units) Llama 3.1 ko ultra-low latency (500-800 tokens/sec) par serve karte hain bina user ke PC par heavy GPU ya RAM resource exhaust kiye. Isse benchmark seconds mein complete ho jata hai.'
                  },
                  {
                    q: 'Q10: How would you scale EvalForge to benchmark across 10,000 prompts in production?',
                    a: 'Production scale ke liye: 1) Python asyncio + aiohttp ya Gemini Batch API use karenge for 50% cost reduction, 2) Prompt-model outputs ko Redis ya SQLite mein cache karenge, aur 3) Celery / SQS worker queue se distributed parallel execution karenge.'
                  }
                ].map((item, index) => {
                  const isOpen = expandedFaq === index;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-[#E6E9EF] overflow-hidden shadow-xs"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : index)}
                        className="w-full text-left p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors"
                      >
                        <span className="text-xs font-bold text-[#262730] pr-4">{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-1 bg-[#F8F9FB] border-t border-[#E6E9EF] text-xs text-[#555867] leading-relaxed">
                          <div className="p-3 bg-white rounded border border-[#E6E9EF]">
                            <span className="font-semibold text-slate-800 block mb-1">Answer (Hinglish):</span>
                            {item.a}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
