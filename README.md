# 🧠 AI Debt Tracker

**AI Debt Tracker** is a comprehensive code analysis platform that detects, measures, and visualizes AI-induced technical debt in GitHub repositories. It goes beyond traditional static analysis by identifying patterns specific to AI-generated code and tracking how debt propagates across your codebase.

## 🌐 Live App

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

---

## 📖 How It Works

### Analysis Pipeline

1. **Repository Ingestion** — Fetches source files from any public GitHub repo via the GitHub API (up to 40 code files)
2. **Pattern Detection** — Runs 14+ heuristic checks on each file for AI-generated code patterns
3. **Technical Debt Scoring** — Measures complexity, nesting, duplication, file size, and modularization
4. **Cognitive Debt Analysis** — Evaluates naming clarity, comment usefulness, readability, and abstraction consistency
5. **Propagation Graph** — Maps import dependencies and shared-pattern connections between files
6. **Commit Timeline** — Analyzes the last N commits to track debt evolution, detect spikes, and identify contributors
7. **AI-Powered Detection** — Uses Lovable AI (Gemini) to verify AI-generated code signals with LLM-based analysis
8. **Recommendations Engine** — Generates step-by-step refactor plans based on detected issues

---

## 📊 Metrics & Formulas

### Core Metrics

| Metric | Range | Formula | Description |
|--------|-------|---------|-------------|
| **AI Likelihood** | 0–1 | Σ(14 weighted heuristic signals) + 0.08 base | Probability a file was AI-generated |
| **Technical Debt** | 0–1 | complexity + nesting + duplication + file_size + modularization | Code structure quality |
| **Cognitive Debt** | 0–1 | CCD×0.25 + (1-ES)×0.2 + AES×0.2 + RDI×0.15 + comment_utility×0.1 + func_readability×0.1 | How hard the code is to understand |
| **Propagation Score** | 0–1 | DPS (see below) | How widely debt spreads through dependencies |

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

### Advanced Technical Debt Metrics

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **Change Proneness** | CP | number_of_modifications / total_commits | How frequently a file is changed |
| **Code Churn** | CCN | lines_added + lines_deleted | Total code turnover per file |
| **Temporal Complexity** | TC | change_frequency × complexity | Complexity weighted by change rate |
| **Defect Density Proxy** | DDP | issues_detected / LOC | Issue concentration per line of code |
| **Modularity Degradation** | MDS | coupling / cohesion | How well the file is modularized |

### Advanced Cognitive Debt Metrics

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **Cognitive Load Index** | CLI | nesting_depth + branching_factor + function_length/50 | Mental effort to understand the code |
| **Identifier Ambiguity** | IAS | unclear_variable_names / total_variables | Naming clarity score |
| **Abstraction Gap Score** | AGS | abs(intent_complexity - implementation_complexity) | Mismatch between intent and implementation |
| **Readability Index** | RI | normalized(avg_line_length + nesting + naming_score) | Overall readability quality |
| **Context Switching Cost** | CSC | dependencies + cross_file_references | Mental jumps required to understand |

### AI Detection Metrics

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **Structural Uniformity** | SUS | 1 - std_dev(function_structures) | How similar all functions look (high = AI) |
| **Token Distribution Divergence** | TDD | KL_divergence(tokens, human_baseline) | Token usage deviation from human patterns |
| **Pattern Repetition Index** | PRI | repeated_patterns / total_patterns | Frequency of repeated logic blocks |
| **Comment Redundancy** | CRS | obvious_comments / total_comments | Comments that restate the code |
| **Style Consistency** | SCS | 1 - variance(formatting_features) | Overly consistent formatting (AI signal) |

### AI-Induced Debt Metrics (Research-Grade)

| Metric | Abbreviation | Formula | Meaning |
|--------|-------------|---------|---------|
| **AI Debt Amplification Factor** | ADAF | total_descendant_debt / original_ai_debt | How much AI code amplifies debt downstream |
| **Cognitive Trace Divergence** | CTD | distance(AI_trace, human_trace) | Deviation from human mental execution trace |
| **Semantic Redundancy Debt** | SRD | redundant_conditions / total_conditions | Unnecessary checks introduced by AI |
| **AI Abstraction Misalignment** | AAM | abstraction_layers / functional_complexity | Wrong-level abstractions |
| **Intent Obfuscation Score** | IOS | semantic_entropy(identifiers) | How hard it is to infer purpose |
| **Human Mental Model Divergence** | HMMD | KL(AI_AST_dist, human_AST_dist) | Structural deviation from human code norms |

### Developer Cognitive Simulation (DCS)

| Metric | Abbreviation | Formula | Weight | Meaning |
|--------|-------------|---------|--------|---------|
| **Intent Recognition Difficulty** | IRD | 1 - intent_transparency | 0.25 | Effort to infer what the code does |
| **Control Flow Simulation Cost** | CFSC | branches × nesting / LOC | 0.20 | Mental effort to trace execution |
| **State Tracking Load** | STL | mutable_variables × reassignments | 0.20 | Burden of tracking variable states |
| **Dependency Resolution Cost** | DRC | external_calls + cross_file_refs | 0.20 | Effort to resolve dependencies |
| **Abstraction Interpretation Cost** | AIC | abstraction_layers / complexity | 0.15 | Effort to understand abstractions |

### Composite Scores

| Score | Formula | Description |
|-------|---------|-------------|
| **AITDIS** | 0.2×ADAF + 0.15×CTD + 0.15×SRD + 0.15×AAM + 0.15×IOS + 0.1×ADPV + 0.1×HMMD | AI Technical Debt Impact Score |
| **DCS** | 0.25×IRD + 0.20×CFSC + 0.20×STL + 0.20×DRC + 0.15×AIC | Developer Cognitive Simulation Score |
| **ACTDI** | 0.4×DCS + 0.3×DPS + 0.2×(DDP+MDS)/2 + 0.1×(1-RI) | AI Cognitive Technical Debt Index |

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

### Technical Debt Detection (Strict Thresholds)

| Check | Threshold | Debt Score |
|-------|-----------|------------|
| Cyclomatic Complexity | >15 | +0.30 |
| Cyclomatic Complexity | >8 | +0.18 |
| Nesting Depth | >4 levels | +0.30 |
| Nesting Depth | >3 levels | +0.18 |
| File Size | >300 LOC | +0.25 |
| File Size | >200 LOC | +0.15 |
| Long Functions | >50 lines | +0.20 per function |
| Duplicate Blocks | >2 duplicates | +0.15 |
| Poor Modularization | >20 functions | +0.10 |

### Commit Timeline Formulas

For each commit `c`:

```
TDS(c) = TDS(c-1) × growthFactor + Δcomplexity + Δduplication + Δnesting
CDS(c) = CDS(c-1) × growthFactor + Δreadability + Δnaming + Δentropy
growthFactor = 1 + (net_growth × 0.3)  // where net_growth = (additions - deletions) / total_changes
```

**Spike Detection**: `Spike = TDS(c) - TDS(c-1) > 0.08`

**Future Prediction**: `Future_TDS = current_TDS + avg_slope × future_commits`

**Developer Impact**: `Impact(dev) = Σ(ΔTDS + ΔCDS) for all commits by developer`

**Trend Classification**:
- 📈 Increasing: avg_slope > 0.15
- 📉 Improving: avg_slope < -0.10
- ⚠️ Unstable: >3 spikes
- 🔁 Fluctuating: otherwise

**Momentum**: Rate of recent (last 5 commits) debt growth — `fast` / `slow` / `stable`

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
│  Graph       │     │  └── Propagation Graph  │
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
│              │     │                        │
│              │     │  human-cognitive-model/ │
│              │     │  └── Cognitive pipeline │
│              │     │      via LLM reasoning  │
└──────────────┘     └────────────────────────┘
         │                      │
         │              ┌───────▼──────┐
         └─────────────▶│  Supabase DB │
                        │  (History)   │
                        └──────────────┘
```

---

## 📁 File Structure & Descriptions

### Pages (`src/pages/`)

| File | Purpose |
|------|---------|
| `Index.tsx` | **Home page** — Hero section, repo URL input, feature highlights grid, stats banner, CTA to dashboard |
| `Dashboard.tsx` | **Main analysis page** — 6-tab layout (Overview, Files, Timeline, Fix Plan, Graph, Deep Analysis) with metric cards, charts, and caching |
| `About.tsx` | **About page** — Project description, collapsible methodology cards (Technical Debt, Cognitive Debt, AI Detection, Propagation), FAQ accordion |
| `Auth.tsx` | **Authentication** — Login/signup with email+password, glassmorphism card, input validation, error handling |
| `NotFound.tsx` | **404 page** — Fallback for undefined routes |

### Core Components (`src/components/`)

| File | Purpose |
|------|---------|
| `Navbar.tsx` | Top navigation bar with links (Home, Dashboard, About), auth state (Login/Logout), and `ThemeToggle` |
| `Footer.tsx` | Site footer with links and branding |
| `AnimatedBackground.tsx` | Full-screen animated gradient mesh with mouse-tracking parallax (glowing blobs in blue/purple/pink) |
| `ThemeToggle.tsx` | Dark/light mode toggle button, saves preference to localStorage |
| `RepoInput.tsx` | GitHub URL input with validation, debounced submit, and loading spinner |

### Dashboard Components (`src/components/`)

| File | Purpose |
|------|---------|
| `MetricCard.tsx` | Animated card displaying a single metric (value, icon, color-coded) with `AnimatedCounter` |
| `AnimatedCounter.tsx` | Smooth number counter animation using `framer-motion` |
| `ScoreBar.tsx` | Gradient progress bar (cyan→red based on severity) for displaying 0–1 scores |
| `MetricTooltip.tsx` | Hover tooltip explaining any metric — maps 35+ metric abbreviations to plain-language descriptions |
| `InsightsPanel.tsx` | 4-panel grid showing: highest debt files, most propagated sources, high cognitive burden, refactor priorities |
| `FileTable.tsx` | Sortable/filterable table of analyzed files with expandable details, AI indicators, confusion hotspots, and `DebtBreakdown` |
| `DebtBreakdown.tsx` | Per-file breakdown of technical debt (complexity, duplication, size), cognitive debt (readability, naming, structure), and AI detection scores |
| `CommitTimeline.tsx` | Interactive commit-by-commit timeline with slider, area charts, spike markers (🚨), developer leaderboard, trend classification, and future prediction (dashed line) |
| `PropagationGraph.tsx` | Circular dependency graph — nodes colored by debt level (red/yellow/green/purple), edges showing propagation type. Includes explanation panel and correction panel on click |
| `RefactorRecommendations.tsx` | Interactive fix plan checklist with priority lanes (Critical/High/Medium), step categorization (Complexity/Structure/Naming/Safety/Readability), effort estimation, and progress tracking |
| `ReportDownload.tsx` | Download analysis as Markdown report (.md) or raw JSON (.json) |
| `HistoryPanel.tsx` | Sidebar showing previously analyzed repos (sorted by recent or debt), with favorite/star toggle and click-to-reload |
| `DeveloperCognitiveSimulation.tsx` | Visualizes AITDIS, DCS, and ACTDI composite scores with gauge charts, radar charts, per-file bar charts, and formula reference |
| `HumanCognitiveModel.tsx` | LLM-powered cognitive pipeline — runs 5-stage analysis via Gemini, displays comprehension debt score, per-file divergence signals, and radar chart |

### Backend Functions (`supabase/functions/`)

| Function | Endpoint | Description |
|----------|----------|-------------|
| `analyze-repo/` | POST `/analyze-repo` | **Main analysis engine** — Fetches repo files from GitHub API, runs 14 heuristic checks, computes technical/cognitive/AI debt, builds propagation graph, generates dataset-calibrated scores via cosine similarity against human/AI reference vectors, and produces human-like explanations |
| `analyze-commits/` | POST `/analyze-commits` | **Commit timeline engine** — Fetches last N commits, scores each commit's patch for tech/cognitive/AI debt deltas, detects spikes, classifies trend, computes developer impact leaderboard, and projects future debt |
| `ai-detect/` | POST `/ai-detect` | **LLM AI detection** — Sends code to Gemini 3 Flash via Lovable AI Gateway with a specialized prompt to detect AI-generated code signals. Returns probability, confidence, signals list, and verdict |
| `human-cognitive-model/` | POST `/human-cognitive-model` | **Cognitive pipeline** — Sends batches of files to Gemini for 5-stage cognitive analysis (Human Code Model → AI Analysis → Divergence Metrics → Comprehension Debt Score). Returns per-file metrics and overall assessment |

### Data Layer (`src/lib/`)

| File | Purpose |
|------|---------|
| `mockAnalysis.ts` | TypeScript interfaces (`FileAnalysis`, `AnalysisResult`, `CommitAnalysis`, `CommitTimelineData`, `PropagationEdge`) and mock data generator for offline/demo use |

### Hooks (`src/hooks/`)

| File | Purpose |
|------|---------|
| `useAuth.ts` | Authentication hook — manages user/session state via Supabase Auth, provides `signOut` function |
| `use-mobile.tsx` | Responsive breakpoint detection hook |
| `use-toast.ts` | Toast notification hook (re-exports from UI) |

### Database (`supabase/`)

| Table | Columns | Purpose |
|-------|---------|---------|
| `analysis_history` | `id`, `user_id`, `repo_url`, `repo_name`, `stars`, `language`, `avg_ai_likelihood`, `avg_technical_debt`, `avg_cognitive_debt`, `total_files`, `high_risk_files`, `is_favorite`, `created_at` | Stores per-user analysis history with RLS protection |

---

## 🏗️ Dashboard Tabs

1. **Overview** — Metric cards, gradient score bars, debt distribution, debt velocity, refactor priority, top risk files with impact simulator, bar/pie/radar charts, debt heatmap, guided insights
2. **Files** — Sortable/filterable file table with expandable debt breakdowns per file
3. **Timeline** — Commit-by-commit debt evolution with interactive slider, spike markers, developer leaderboard, trend classification, future prediction
4. **Fix Plan** — Step-by-step refactor recommendations with priority levels, categorized steps, effort estimation, and interactive progress tracking
5. **Graph** — Propagation graph showing import dependencies and shared-pattern connections with explanation and correction panels
6. **Deep Analysis** — Developer Cognitive Simulation (AITDIS/DCS/ACTDI gauges and radar charts) and Human Cognitive Model (LLM-powered 5-stage pipeline)

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

## 🔬 Research Foundations

The metrics in this system draw from established software engineering research:

- **Cognitive Complexity** — Inspired by SonarQube's cognitive complexity metric (G. Ann Campbell, SonarSource)
- **Code Churn & Change Proneness** — Based on Nagappan & Ball (ICSE 2005) linking churn metrics to defect density
- **LLM Authorship Attribution** — Uses structural uniformity and token distribution analysis inspired by DetectGPT (Mitchell et al., ICML 2023)
- **Code Entropy Profiling** — Applies information-theoretic measures to detect AI-generated uniformity (Kirchenbauer et al., ICLR 2023)
- **Cognitive Load Theory** — Applies Sweller's cognitive load framework to code comprehension measurement
- **Debt Propagation** — Models technical debt as a graph problem, tracking spread through dependency chains

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

## 🔒 Security

- All user data is protected by Row-Level Security (RLS) policies
- Users can only access their own analysis history
- API keys are stored as secrets, never in client code
- GitHub API tokens are server-side only

---

## 📄 License

This project is built with [Lovable](https://lovable.dev).
