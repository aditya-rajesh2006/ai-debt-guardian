// Mock analysis engine - simulates PMD, SonarQube, Tree-sitter outputs

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
  };
  linesOfCode: number;
  functions: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
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

export function generateMockAnalysis(repoName: string): AnalysisResult {
  const numFiles = 12 + Math.floor(Math.random() * 12);
  const files = pickRandom(FILE_TEMPLATES, numFiles);

  const fileAnalyses: FileAnalysis[] = files.map(file => {
    const aiLikelihood = rand(0.1, 0.95);
    const isHighAI = aiLikelihood > 0.6;

    return {
      file,
      aiLikelihood,
      technicalDebt: isHighAI ? rand(0.4, 0.9) : rand(0.1, 0.5),
      cognitiveDebt: isHighAI ? rand(0.5, 0.95) : rand(0.1, 0.4),
      propagationScore: rand(0.1, 0.9),
      issues: pickRandom(ISSUE_TYPES, isHighAI ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1),
      metrics: {
        ccd: rand(0, 1),
        es: rand(0, 1),
        aes: isHighAI ? rand(0.5, 1) : rand(0, 0.4),
        rdi: rand(0, 1),
        dps: rand(0, 1),
        dli: rand(0, 1),
        drf: rand(0, 1),
      },
      linesOfCode: Math.floor(Math.random() * 400) + 50,
      functions: Math.floor(Math.random() * 15) + 2,
      cyclomaticComplexity: Math.floor(Math.random() * 20) + 1,
      nestingDepth: Math.floor(Math.random() * 6) + 1,
      aiDebtContribution: isHighAI ? rand(40, 90) : rand(5, 30),
    };
  });

  const propagation: PropagationEdge[] = [];
  const types: PropagationEdge['type'][] = ['clone', 'dependency', 'pattern', 'import'];
  for (let i = 0; i < Math.min(numFiles * 1.5, 20); i++) {
    const s = Math.floor(Math.random() * numFiles);
    let t = Math.floor(Math.random() * numFiles);
    if (t === s) t = (t + 1) % numFiles;
    propagation.push({
      source: files[s],
      target: files[t],
      weight: rand(0.2, 1),
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  const avgAiLikelihood = fileAnalyses.reduce((s, f) => s + f.aiLikelihood, 0) / numFiles;
  const avgTechnicalDebt = fileAnalyses.reduce((s, f) => s + f.technicalDebt, 0) / numFiles;
  const avgCognitiveDebt = fileAnalyses.reduce((s, f) => s + f.cognitiveDebt, 0) / numFiles;

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
  };
}
