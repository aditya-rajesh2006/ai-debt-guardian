// Mock analysis engine - simulates PMD, SonarQube, Tree-sitter outputs

export interface ModelAttribution {
  model_id: string;
  confidence: number;
}

export interface FileAnalysis {
  file: string;
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  propagationScore: number;
  issues: string[];
  metrics: {
    ccd: number; // Cognitive Complexity Drift
    es: number;  // Explainability Score
    aes: number; // AI Entropy Score
    rdi: number; // Readability Degradation Index
    dps: number; // Debt Propagation Score
    dli: number; // Debt Longevity Index
    drf: number; // Dependency Risk Factor
    // Advanced Technical
    cp: number;   // Change Proneness
    ccn: number;  // Code Churn
    tc: number;   // Temporal Complexity
    ddp: number;  // Defect Density Proxy
    mds: number;  // Modularity Degradation Score
    // Advanced Cognitive
    cli: number;  // Cognitive Load Index
    ias: number;  // Identifier Ambiguity Score
    ags: number;  // Abstraction Gap Score
    ri: number;   // Readability Index
    csc: number;  // Context Switching Cost
    // AI Detection
    sus: number;  // Structural Uniformity Score
    tdd: number;  // Token Distribution Divergence
    pri: number;  // Pattern Repetition Index
    crs: number;  // Comment Redundancy Score
    scs: number;  // Style Consistency Score
  };
  linesOfCode: number;
  functions: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
  modelAttribution: ModelAttribution;
  aiTechnicalDebt: number;
  aiCognitiveDebt: number;
  aiTotalDebt: number;
}

export interface PropagationEdge {
  source: string;
  target: string;
  weight: number;
  type: 'clone' | 'dependency' | 'pattern' | 'import';
}

export interface AnalysisResult {
  repoName: string;
  totalFiles: number;
  stars?: number;
  language?: string;
  files: FileAnalysis[];
  propagation: PropagationEdge[];
  summary: {
    avgAiLikelihood: number;
    avgTechnicalDebt: number;
    avgCognitiveDebt: number;
    totalIssues: number;
    highRiskFiles: number;
    topRefactorTargets: string[];
  };
  ai_percentage: number;
  model_attribution: ModelAttribution;
  ai_technical_debt: number;
  ai_cognitive_debt: number;
  ai_total_debt: number;
}

export interface CommitAnalysis {
  sha: string;
  message: string;
  author: string;
  date: string;
  techDebt: number;
  cogDebt: number;
  aiContribution: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  isSpike: boolean;
}

export interface CommitTimelineData {
  commits: CommitAnalysis[];
  developers: { name: string; techImpact: number; cogImpact: number; commits: number; totalImpact: number }[];
  trend: string;
  momentum: string;
  prediction: { techDebt5: number; techDebt10: number; cogDebt5: number; cogDebt10: number };
  spikeCount: number;
}

const ISSUE_TYPES = [
  'duplicate code', 'deep nesting', 'high cyclomatic complexity',
  'overly generic naming', 'excessive comments', 'unused imports',
  'poor modularization', 'inconsistent naming', 'redundant logic',
  'unnecessary abstraction', 'missing error handling', 'magic numbers',
  'long parameter list', 'god function', 'dead code',
];

const FILE_TEMPLATES = [
  'src/components/Dashboard.tsx', 'src/utils/helpers.ts', 'src/api/client.ts',
  'src/hooks/useAuth.ts', 'src/services/analytics.ts', 'src/lib/parser.ts',
  'src/components/DataTable.tsx', 'src/utils/formatters.ts', 'src/api/endpoints.ts',
  'src/hooks/useData.ts', 'src/services/cache.ts', 'src/lib/validators.ts',
  'src/components/Chart.tsx', 'src/utils/constants.ts', 'src/api/interceptors.ts',
  'src/hooks/useWebSocket.ts', 'src/services/logger.ts', 'src/lib/transforms.ts',
  'src/components/Modal.tsx', 'src/utils/types.ts', 'src/middleware/auth.ts',
  'src/components/Form.tsx', 'src/store/actions.ts', 'src/store/reducers.ts',
];

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const AI_MODELS = [
  { id: 'codellama', risk: 0.65 },
  { id: 'gpt-4', risk: 0.45 },
  { id: 'gpt-3.5-turbo', risk: 0.72 },
  { id: 'claude-3', risk: 0.38 },
  { id: 'gemini-pro', risk: 0.50 },
  { id: 'copilot', risk: 0.55 },
  { id: 'deepseek-coder', risk: 0.60 },
  { id: 'starcoder', risk: 0.68 },
];

function pickModel(aiLikelihood: number): ModelAttribution {
  // Simulate model fingerprinting via structural heuristics
  const idx = Math.floor(Math.random() * AI_MODELS.length);
  const confidence = aiLikelihood > 0.5
    ? rand(0.55, 0.92)
    : rand(0.20, 0.50);
  return { model_id: AI_MODELS[idx].id, confidence };
}

function getModelRisk(modelId: string): number {
  return AI_MODELS.find(m => m.id === modelId)?.risk ?? 0.5;
}

export function generateMockAnalysis(repoName: string): AnalysisResult {
  const numFiles = 12 + Math.floor(Math.random() * 12);
  const files = pickRandom(FILE_TEMPLATES, numFiles);

  const fileAnalyses: FileAnalysis[] = files.map(file => {
    const aiLikelihood = rand(0.1, 0.95);
    const isHighAI = aiLikelihood > 0.6;
    const technicalDebt = isHighAI ? rand(0.4, 0.9) : rand(0.1, 0.5);
    const cognitiveDebt = isHighAI ? rand(0.5, 0.95) : rand(0.1, 0.4);
    const modelAttr = pickModel(aiLikelihood);
    const modelRisk = getModelRisk(modelAttr.model_id);

    // AI_signal = AI_likelihood × ModelConfidence
    const aiSignal = aiLikelihood * modelAttr.confidence;

    // AI_TDS = AI_signal * (0.35*CC + 0.25*ND + 0.20*Dup + 0.20*Churn)
    const cc = rand(0.1, 0.9);
    const nd = rand(0.1, 0.8);
    const dup = rand(0.05, 0.5);
    const churn = rand(0.1, 0.6);
    const aiTDS = aiSignal * (0.35 * cc + 0.25 * nd + 0.20 * dup + 0.20 * churn);
    const dps = rand(0.1, 0.9);
    const aiPropRisk = aiSignal * dps;
    const aiTechnicalDebt = Math.round(Math.min(aiTDS + aiPropRisk, 1) * 100) / 100;

    // AI_CDS = AI_signal * (0.30*CLI + 0.25*IAS + 0.20*AGS + 0.15*CSC + 0.10*entropy)
    const cli = rand(0, 1);
    const ias = rand(0, 1);
    const ags = rand(0, 1);
    const csc = rand(0, 1);
    const entropy = rand(0, 0.5);
    const aiCDS = aiSignal * (0.30 * cli + 0.25 * ias + 0.20 * ags + 0.15 * csc + 0.10 * entropy);
    const aiModelRisk = aiSignal * modelRisk;
    const aiCognitiveDebt = Math.round(Math.min(aiCDS + aiModelRisk, 1) * 100) / 100;

    const aiTotalDebt = Math.round((aiTechnicalDebt + aiCognitiveDebt) * 100) / 100;

    return {
      file,
      aiLikelihood,
      technicalDebt,
      cognitiveDebt,
      propagationScore: dps,
      issues: pickRandom(ISSUE_TYPES, isHighAI ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1),
      metrics: {
        ccd: rand(0, 1), es: rand(0, 1),
        aes: isHighAI ? rand(0.5, 1) : rand(0, 0.4),
        rdi: rand(0, 1), dps, dli: rand(0, 1), drf: rand(0, 1),
        cp: rand(0, 1), ccn: Math.floor(Math.random() * 400) + 50,
        tc: rand(0, 1), ddp: rand(0, 1), mds: rand(0, 1),
        cli, ias, ags,
        ri: rand(0, 1), csc,
        sus: isHighAI ? rand(0.4, 0.9) : rand(0, 0.3),
        tdd: rand(0, 0.5), pri: isHighAI ? rand(0.3, 0.8) : rand(0, 0.2),
        crs: isHighAI ? rand(0.3, 0.8) : rand(0, 0.2),
        scs: isHighAI ? rand(0.5, 0.9) : rand(0.1, 0.4),
      },
      linesOfCode: Math.floor(Math.random() * 400) + 50,
      functions: Math.floor(Math.random() * 15) + 2,
      cyclomaticComplexity: Math.floor(Math.random() * 20) + 1,
      nestingDepth: Math.floor(Math.random() * 6) + 1,
      aiDebtContribution: isHighAI ? rand(40, 90) : rand(5, 30),
      modelAttribution: modelAttr,
      aiTechnicalDebt,
      aiCognitiveDebt,
      aiTotalDebt,
    };
  });

  const propagation: PropagationEdge[] = [];
  const types: PropagationEdge['type'][] = ['clone', 'dependency', 'pattern', 'import'];
  for (let i = 0; i < Math.min(numFiles * 1.5, 20); i++) {
    const s = Math.floor(Math.random() * numFiles);
    let t = Math.floor(Math.random() * numFiles);
    if (t === s) t = (t + 1) % numFiles;
    propagation.push({
      source: files[s], target: files[t],
      weight: rand(0.2, 1),
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  const avgAiLikelihood = fileAnalyses.reduce((s, f) => s + f.aiLikelihood, 0) / numFiles;
  const avgTechnicalDebt = fileAnalyses.reduce((s, f) => s + f.technicalDebt, 0) / numFiles;
  const avgCognitiveDebt = fileAnalyses.reduce((s, f) => s + f.cognitiveDebt, 0) / numFiles;

  // Repo-level AI%: LOC-weighted
  const totalLOC = fileAnalyses.reduce((s, f) => s + f.linesOfCode, 0);
  const aiPct = Math.round(fileAnalyses.reduce((s, f) => s + f.aiLikelihood * f.linesOfCode, 0) / totalLOC * 100) / 100;

  // Dominant model across repo
  const modelVotes = new Map<string, number>();
  for (const f of fileAnalyses) {
    modelVotes.set(f.modelAttribution.model_id, (modelVotes.get(f.modelAttribution.model_id) || 0) + f.modelAttribution.confidence);
  }
  let bestModel = 'unknown';
  let bestScore = 0;
  for (const [m, s] of modelVotes) {
    if (s > bestScore) { bestModel = m; bestScore = s; }
  }
  const repoModelConfidence = Math.round(bestScore / numFiles * 100) / 100;

  const totalAiTech = Math.round(fileAnalyses.reduce((s, f) => s + f.aiTechnicalDebt, 0) / numFiles * 100) / 100;
  const totalAiCog = Math.round(fileAnalyses.reduce((s, f) => s + f.aiCognitiveDebt, 0) / numFiles * 100) / 100;

  return {
    repoName,
    totalFiles: numFiles,
    files: fileAnalyses,
    propagation,
    summary: {
      avgAiLikelihood: Math.round(avgAiLikelihood * 100) / 100,
      avgTechnicalDebt: Math.round(avgTechnicalDebt * 100) / 100,
      avgCognitiveDebt: Math.round(avgCognitiveDebt * 100) / 100,
      totalIssues: fileAnalyses.reduce((s, f) => s + f.issues.length, 0),
      highRiskFiles: fileAnalyses.filter(f => f.aiLikelihood > 0.7 && f.technicalDebt > 0.5).length,
      topRefactorTargets: fileAnalyses
        .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
        .slice(0, 3)
        .map(f => f.file),
    },
    ai_percentage: aiPct * 100,
    model_attribution: { model_id: bestModel, confidence: repoModelConfidence },
    ai_technical_debt: totalAiTech,
    ai_cognitive_debt: totalAiCog,
    ai_total_debt: Math.round((totalAiTech + totalAiCog) * 100) / 100,
  };
}
