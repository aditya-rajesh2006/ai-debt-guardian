# 🧠 AI Debt Tracker

**AI Debt Tracker** is a comprehensive code analysis platform that detects, measures, and visualizes AI-induced technical debt in GitHub repositories. It goes beyond traditional static analysis by identifying patterns specific to AI-generated code, attributing code to specific AI models, and tracking how debt propagates across your codebase.

## 🌐 Live App

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

---

## 📖 How It Works

### Analysis Pipeline

1. **Repository Ingestion** — Fetches source files from any public GitHub repo via the GitHub API (up to 40 code files)
2. **Pattern Detection** — Runs 14+ heuristic checks on each file for AI-generated code patterns
3. **Model Attribution** — Estimates which AI model generated each file using structural fingerprinting
4. **Technical Debt Scoring** — Measures complexity, nesting, duplication, file size, and modularization
5. **Cognitive Debt Analysis** — Evaluates naming clarity, comment usefulness, readability, and abstraction consistency
6. **AI-Specific Debt Formulas** — Computes AI_TDS and AI_CDS using model-aware signal weighting
7. **Propagation Graph** — Maps import dependencies and shared-pattern connections between files
8. **Commit Timeline** — Analyzes the last N commits to track debt evolution, detect spikes, and identify contributors
9. **AI-Powered Detection** — Uses Lovable AI (Gemini) to verify AI-generated code signals with LLM-based analysis
10. **Recommendations Engine** — Generates step-by-step refactor plans based on detected issues

---

## 📊 Metrics & Formulas

### Core Metrics

| Metric | Range | Formula | Description |
|--------|-------|---------|-------------|
| **AI Likelihood** | 0–1 | Σ(14 weighted heuristic signals) + 0.08 base | Probability a file was AI-generated |
| **Technical Debt** | 0–1 | complexity + nesting + duplication + file_size + modularization | Code structure quality |
| **Cognitive Debt** | 0–1 | CCD×0.15 + (1-ES)×0.1 + AES×0.1 + RDI×0.1 + CLI×0.15 + IAS×0.1 + AGS×0.1 + RI×0.1 + CSC×0.1 | How hard the code is to understand |
| **Propagation Score** | 0–1 | DPS (see below) | How widely debt spreads through dependencies |

### 🧠 Model Attribution Module

For each candidate model M_i, compute approximate log-likelihood:

```
L(C | M_i) = f(SUS, TDD, SCS, ModelRisk_i)  // structural fingerprint approximation
```

Posterior probability via softmax:

```
P(M_i | C) = Softmax(L(C | M_1), ..., L(C | M_k))
ModelID = argmax_i P(M_i | C)
ModelConfidence = max_i P(M_i | C)
```

When direct log-likelihood APIs are unavailable, attribution uses:
- **Perplexity differential** — deviation from expected token distributions per model
- **Structural fingerprint vector** — SUS, TDD, SCS combined with model-specific risk priors
- **Token entropy profile** — entropy characteristics that differ across model families

### ⚙️ AI-Specific Technical Debt

```
AI_signal = AI_likelihood × ModelConfidence

AI_TDS = AI_signal × (
  0.35 × CyclomaticComplexity +
  0.25 × NestingDepth +
  0.20 × Duplication +
  0.20 × CodeChurn
)

AI_PropagationRisk = AI_signal × DPS

AI_TD_Final = AI_TDS + AI_PropagationRisk
```

### 🧠 AI-Specific Cognitive Debt

```
AI_CDS = AI_signal × (
  0.30 × CLI +
  0.25 × IdentifierAmbiguity +
  0.20 × AbstractionGap +
  0.15 × ContextSwitchingCost +
  0.10 × EntropyDeviation
)

AI_ModelRisk = AI_signal × ModelRisk(M_i)

AI_CD_Final = AI_CDS + AI_ModelRisk
```

### 🔬 Model Risk Factor

```
ModelRisk(M_i) = empirical average maintainability risk for model M_i
```

| Model | Risk Factor |
|-------|------------|
| claude-3 | 0.38 |
| gpt-4 | 0.45 |
| gemini-pro | 0.50 |
| copilot | 0.55 |
| deepseek-coder | 0.60 |
| codellama | 0.65 |
| starcoder | 0.68 |
| gpt-3.5-turbo | 0.72 |

### 📈 Final AI-Induced Debt

```
AI_Total_Debt = AI_TD_Final + AI_CD_Final
```

### 📊 AI-Generated Code Percentage

```
AI% = (Σ AI_likelihood(file_i) × LOC_i) / Total_LOC
```

Normalized to 0–100%.

### Detailed Sub-Metrics

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **Cognitive Complexity Drift** | CCD | control_flow_keywords / (total_lines × 0.12 + 1) | How convoluted the control flow is |
| **Explainability Score** | ES | avg_identifier_length / 12 | How self-explanatory the code naming is |
| **AI Entropy Score** | AES | std_dev(line_lengths) / 40 | Structural variance (low = AI-like uniformity) |
| **Readability Degradation Index** | RDI | f(comment_ratio) — 0.8 if >30%, 0.3 if 5-30%, 0.55 if <5% | Balance of documentation |
| **Debt Propagation Score** | DPS | tech_debt × 0.6 + ai_likelihood × 0.4 | How much this file spreads debt to others |
| **Debt Longevity Index** | DLI | tech_debt × 0.5 + CCD × 0.5 | How persistent the debt is likely to be |
| **Dependency Risk Factor** | DRF | AES × 0.4 + tech_debt × 0.3 + ai_likelihood × 0.3 | Risk from depending on this file |
| **Change Proneness** | CP | issues / 8 (static proxy) | How frequently this file needs modification |
| **Code Churn** | CCN | lines_added + lines_deleted | Total code volatility |
| **Temporal Complexity** | TC | CP × cyclomatic_complexity / 10 | Change frequency × complexity |
| **Defect Density Proxy** | DDP | issues / (LOC / 100) | Issue density per 100 lines |
| **Modularity Degradation** | MDS | imports / (exports × 3) | Coupling vs cohesion ratio |
| **Cognitive Load Index** | CLI | (nesting + branching + func_length/50) / 8 | Mental effort to understand |
| **Identifier Ambiguity** | IAS | (short_ids + generic_ids) / (total_ids × 0.1) | Naming clarity |
| **Abstraction Gap** | AGS | abs(complexity/func - name_length/15) | Intent vs implementation mismatch |
| **Readability Index** | RI | (avg_line_len/80 + nesting/6 + (1-naming)) / 3 | Overall readability |
| **Context Switching Cost** | CSC | (imports + func_calls/5) / 20 | Cognitive switching load |

### AI Detection Heuristics (14 Checks — Strict Mode)

1. **Generic Naming** — Detects `temp`, `data`, `result`, `item`, `val`, `handler`, `callback`, `args`, `params`, `config`, etc. Threshold: >0.8% of lines
2. **Excessive Comments** — Comment ratio >20% flags AI-generated verbosity
3. **Over-Explained Comments** — Comments that restate code: "// get the value", "// return result"
4. **Duplicate Code Blocks** — Lines repeated 2+ times (strict) with length >12 chars
5. **Similar Function Structures** — Functions stripped of identifiers showing <60% unique patterns
6. **Cross-File Repetition** — 40-80 char chunks found verbatim in other files
7. **Inconsistent Naming** — Mixed camelCase + snake_case in same file
8. **Long Parameter Lists** — Parameters spanning >90 characters
9. **Magic Numbers** — Unexplained numeric literals >2 digits
10. **Missing Error Handling** — Async code without try/catch
11. **Unnecessary Abstraction** — Tiny wrapper functions (<80 chars when minified)
12. **Uniform Line Lengths** — Standard deviation <12 across 20+ lines (AI signature)
13. **Perfectly Sorted Imports** — Import statements in alphabetical order (AI tendency)
14. **Excessive Type Annotations** — >5% of lines with primitive type annotations

### AI Detection Metrics

| Metric | Abbreviation | Description |
|--------|-------------|-------------|
| **Structural Uniformity Score** | SUS | Similarity across functions — high values indicate AI generation |
| **Token Distribution Divergence** | TDD | Deviation from human-like token usage patterns |
| **Pattern Repetition Index** | PRI | Frequency of repeated logic blocks |
| **Comment Redundancy Score** | CRS | Comments explaining obvious logic |
| **Style Consistency Score** | SCS | Suspiciously uniform formatting |

**Final AI % = weighted average of SUS×0.25 + PRI×0.2 + CRS×0.2 + IAS×0.15 + entropy×0.2**

### Commit Timeline Formulas

For each commit `c`:

```
TDS(c) = TDS(c-1) × growthFactor + Δcomplexity + Δduplication + Δnesting
CDS(c) = CDS(c-1) × growthFactor + Δreadability + Δnaming + Δentropy
growthFactor = 1 + (net_growth × 0.3)
```

**Spike Detection**: `Spike = TDS(c) - TDS(c-1) > 0.08`

**Future Prediction**: `Future_TDS = current_TDS + avg_slope × future_commits`

**Developer Impact**: `Impact(dev) = Σ(ΔTDS + ΔCDS) for all commits by developer`

---

## 📚 Research Foundations

### LLM Authorship Attribution

The model attribution engine is inspired by research on LLM output identification:

- **Log-likelihood comparison** — Computing per-token log probabilities under different models to determine which model most likely produced a given output. When a model M_i assigns high probability to a code sequence C, the log-likelihood L(C|M_i) = Σ_t log P_M_i(c_t | c_<t) will be high, suggesting M_i generated C. (Solaiman et al., 2019; Mitchell et al., 2023)

- **Model fingerprinting** — Different LLMs exhibit characteristic structural patterns. GPT-family models tend toward specific formatting choices and comment styles; CodeLlama shows different token distribution profiles. These "fingerprints" emerge from training data and architecture differences. (Tian et al., 2023; Krishna et al., ICML 2024)

- **Watermarking and detection** — Research on watermarking LLM outputs (Kirchenbauer et al., ICML 2023) demonstrates that model-specific token probability distributions create detectable signatures, even without access to the original model.

### Why Entropy Signals Differ Per Model

Each model family has characteristic entropy profiles:
- **Temperature settings** during generation affect token-level entropy
- **Training data composition** creates model-specific vocabulary preferences
- **Decoding strategies** (nucleus sampling, beam search) produce distinct distribution shapes
- These differences manifest as measurable Token Distribution Divergence (TDD) scores

### Why AI-Generated Code Increases Structural Uniformity

AI models tend to produce code with:
- **Consistent formatting** — uniform indentation, line lengths, and spacing patterns (measured by SCS)
- **Repetitive structures** — similar function signatures and control flow patterns across files (measured by SUS and PRI)
- **Generic naming** — variable names like `data`, `result`, `value` that lack domain-specific context (measured by IAS)
- **Redundant comments** — explanations of obvious code logic that human developers omit (measured by CRS)

### Why Propagation Modeling Is Necessary

Technical debt doesn't exist in isolation. Research on software evolution shows:
- Debt in one file **propagates** through import dependencies and shared patterns (Zazworka et al., 2011)
- AI-generated code amplifies propagation because similar patterns get reused across files
- The Debt Propagation Score (DPS) quantifies this spread: `DPS = tech_debt × 0.6 + ai_likelihood × 0.4`

### Key Citations

1. Solaiman, I. et al. (2019). "Release Strategies and the Social Impacts of Language Models." arXiv:1908.09203
2. Mitchell, E. et al. (2023). "DetectGPT: Zero-Shot Machine-Generated Text Detection." ICML 2023
3. Kirchenbauer, J. et al. (2023). "A Watermark for Large Language Models." ICML 2023
4. Krishna, K. et al. (2024). "Paraphrasing Evades Detectors of AI-Generated Text, but Retrieval is an Effective Defense." ICML 2024
5. Tian, E. et al. (2023). "GPTZero: Towards Detection of AI-Generated Text"
6. Campbell, G.A. (2018). "Cognitive Complexity: A New Way of Measuring Understandability." SonarSource
7. Zazworka, N. et al. (2011). "Investigating the Impact of Design Debt on Software Quality." MTD Workshop, ICSE
8. Nagappan, N. & Ball, T. (2005). "Use of Relative Code Churn Measures to Predict System Defect Density." ICSE 2005
9. Lenarduzzi, V. et al. (2021). "A Systematic Literature Review on Technical Debt Prioritization." JSS

---

## 🏗️ Architecture

```
┌──────────────┐     ┌────────────────────────┐
│   React App  │────▶│  Lovable Cloud (Edge)  │
│  (Vite/TS)   │     │                        │
│              │     │  analyze-repo/          │
│  Dashboard   │     │  ├── Pattern Detection  │
│  Timeline    │     │  ├── Tech Debt Scoring  │
│  Fix Plan    │     │  ├── Cognitive Analysis │
│  Graph       │     │  ├── Model Attribution  │
│              │     │  └── Propagation Graph  │
│              │     │                        │
│              │     │  analyze-commits/       │
│              │     │  ├── Commit Timeline    │
│              │     │  ├── Spike Detection    │
│              │     │  ├── Developer Impact   │
│              │     │  └── Trend/Prediction   │
│              │     │                        │
│              │     │  ai-detect/             │
│              │     │  └── LLM-based AI code  │
│              │     │      detection (Gemini) │
└──────────────┘     └────────────────────────┘
         │                      │
         │              ┌───────▼──────┐
         └─────────────▶│  Supabase DB │
                        │  (History)   │
                        └──────────────┘
```

### API Response Format

```json
{
  "ai_percentage": 62.5,
  "model_attribution": {
    "model_id": "codellama",
    "confidence": 0.73
  },
  "ai_technical_debt": 0.45,
  "ai_cognitive_debt": 0.38,
  "ai_total_debt": 0.83,
  "summary": { ... },
  "files": [
    {
      "modelAttribution": { "model_id": "gpt-4", "confidence": 0.68 },
      "aiTechnicalDebt": 0.52,
      "aiCognitiveDebt": 0.41,
      "aiTotalDebt": 0.93,
      ...
    }
  ]
}
```

### Pages

| Page | Purpose |
|------|---------|
| **Home** (`/`) | Hero, repo input, feature highlights, CTA |
| **Dashboard** (`/dashboard`) | Full analysis with 5 tabs: Overview, Files, Timeline, Fix Plan, Graph |
| **About** (`/about`) | Project info, FAQ accordion, methodology |
| **Auth** (`/auth`) | Login / Signup with email verification |

### Dashboard Tabs

1. **Overview** — Metric cards, model attribution banner, refactor priority score, confidence score, top risk files with impact simulator, bar/pie/radar charts, debt heatmap, guided insights
2. **Files** — Sortable/filterable file table with expandable debt breakdowns, model attribution per file
3. **Timeline** — Commit-by-commit debt evolution with interactive slider, spike markers, developer leaderboard, trend classification, future prediction
4. **Fix Plan** — Step-by-step refactor recommendations with priority levels and impact estimates
5. **Graph** — Propagation graph showing import dependencies and shared-pattern connections

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts (Bar, Pie, Radar, Area, Heatmap)
- **Backend**: Lovable Cloud (Supabase Edge Functions, Deno)
- **AI**: Lovable AI Gateway (Google Gemini 3 Flash)
- **Database**: PostgreSQL (via Supabase) with Row-Level Security
- **Auth**: Supabase Auth with email/password

---

## 🚀 Getting Started

### Option 1: Use Lovable (Recommended)

Visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start using it directly.

### Option 2: Local Development

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

Requirements: Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

---

## ⚠️ Limitations

- **Attribution is probabilistic** — Model identification is based on structural fingerprinting and token entropy profiling, not direct access to model log-likelihood APIs
- **Accuracy decreases with editing** — If AI-generated code has been heavily refactored or edited by humans, detection and attribution reliability diminishes
- **Fine-tuned models** — Custom or fine-tuned models may exhibit patterns outside the baseline model fingerprint library, reducing attribution accuracy
- **Static approximation** — Metrics like Change Proneness and Code Churn are approximated from static analysis when commit history is not available

---

## 🔒 Security

- All user data is protected by Row-Level Security (RLS) policies
- Users can only access their own analysis history
- API keys are stored as secrets, never in client code
- GitHub API tokens are server-side only

---

## 📄 License

This project is built with [Lovable](https://lovable.dev).
