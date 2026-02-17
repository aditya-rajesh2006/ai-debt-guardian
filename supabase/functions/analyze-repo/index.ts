import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubFile {
  name: string;
  path: string;
  size: number;
  type: string;
  download_url: string | null;
}

interface FileAnalysis {
  file: string;
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  propagationScore: number;
  issues: string[];
  metrics: { ccd: number; es: number; aes: number; rdi: number; dps: number; dli: number; drf: number };
  linesOfCode: number;
  functions: number;
  cyclomaticComplexity: number;
  nestingDepth: number;
  aiDebtContribution: number;
}

interface PropagationEdge {
  source: string;
  target: string;
  weight: number;
  type: 'clone' | 'dependency' | 'pattern' | 'import';
}

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";

async function fetchGitHub(url: string) {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'AIDebtTracker' };
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json();
}

function parseOwnerRepo(input: string): { owner: string; repo: string } {
  const cleaned = input.replace(/\/$/, '').replace(/\.git$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) return { owner: match[1], repo: match[2] };
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 2) return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
  throw new Error('Invalid repository URL');
}

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.rb', '.php',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt', '.scala', '.vue', '.svelte',
]);

function isCodeFile(path: string): boolean {
  return CODE_EXTENSIONS.has('.' + path.split('.').pop()?.toLowerCase());
}

// --- AI Detection Heuristics ---
function detectAIPatterns(content: string): { aiLikelihood: number; issues: string[]; aiDebtContribution: number } {
  const issues: string[] = [];
  let score = 0;
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Generic variable names
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input)\b/g);
  if (genericNames && genericNames.length > totalLines * 0.02) { score += 0.15; issues.push('overly generic naming'); }

  // Excessive comments
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('*')).length;
  if (commentLines > totalLines * 0.3) { score += 0.1; issues.push('excessive comments'); }

  // Repetitive structures (similar consecutive lines)
  let repetitive = 0;
  for (let i = 1; i < lines.length; i++) {
    const a = lines[i - 1].trim(), b = lines[i].trim();
    if (a.length > 10 && a === b) repetitive++;
  }
  if (repetitive > 3) { score += 0.15; issues.push('duplicate code'); }

  // Inconsistent naming (mix of camelCase and snake_case)
  const camel = content.match(/[a-z][A-Z]/g)?.length || 0;
  const snake = content.match(/[a-z]_[a-z]/g)?.length || 0;
  if (camel > 5 && snake > 5) { score += 0.1; issues.push('inconsistent naming'); }

  // Deep nesting detection
  const maxIndent = Math.max(...lines.map(l => l.match(/^(\s*)/)?.[1].length || 0));
  if (maxIndent > 16) { score += 0.1; issues.push('deep nesting'); }

  // Unnecessary abstraction (single-use functions)
  const funcDecl = content.match(/function\s+\w+|const\s+\w+\s*=\s*(\(|async)/g)?.length || 0;
  if (funcDecl > totalLines / 10) { score += 0.1; issues.push('unnecessary abstraction'); }

  // Long parameter lists
  const longParams = content.match(/\([^)]{80,}\)/g);
  if (longParams && longParams.length > 2) { score += 0.05; issues.push('long parameter list'); }

  // Magic numbers
  const magicNums = content.match(/(?<![.\w])\d{2,}(?![.\w])/g);
  if (magicNums && magicNums.length > 5) { score += 0.05; issues.push('magic numbers'); }

  // Missing error handling
  const hasTryCatch = content.includes('try') && content.includes('catch');
  const hasAsync = content.includes('async') || content.includes('await') || content.includes('.then');
  if (hasAsync && !hasTryCatch) { score += 0.1; issues.push('missing error handling'); }

  const aiLikelihood = Math.min(score + 0.1, 1);
  const aiDebtContribution = aiLikelihood > 0.5 ? 40 + aiLikelihood * 50 : 5 + aiLikelihood * 30;

  return { aiLikelihood: Math.round(aiLikelihood * 100) / 100, issues, aiDebtContribution: Math.round(aiDebtContribution) };
}

// --- Technical Debt Detection (simulated PMD/SonarQube) ---
function detectTechnicalDebt(content: string): { technicalDebt: number; cyclomaticComplexity: number; nestingDepth: number; linesOfCode: number; functions: number } {
  const lines = content.split('\n');
  const linesOfCode = lines.filter(l => l.trim().length > 0).length;

  // Cyclomatic complexity approximation
  const branches = (content.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/g) || []).length;
  const cyclomaticComplexity = 1 + branches;

  // Nesting depth
  let maxDepth = 0, depth = 0;
  for (const ch of content) {
    if (ch === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === '}') depth--;
  }

  // Function count
  const funcMatches = content.match(/function\s|=>\s*{|const\s+\w+\s*=\s*\(/g);
  const functions = funcMatches?.length || 1;

  // Technical debt score based on complexity, size, nesting
  let debt = 0;
  debt += Math.min(cyclomaticComplexity / 30, 0.4);
  debt += Math.min(maxDepth / 8, 0.3);
  debt += Math.min(linesOfCode / 500, 0.3);

  return {
    technicalDebt: Math.round(Math.min(debt, 1) * 100) / 100,
    cyclomaticComplexity,
    nestingDepth: maxDepth,
    linesOfCode,
    functions,
  };
}

// --- Cognitive Debt Detection ---
function detectCognitiveDebt(content: string, techDebt: number, aiLikelihood: number): { cognitiveDebt: number; metrics: FileAnalysis['metrics'] } {
  const lines = content.split('\n');
  const totalLines = lines.length;

  // CCD - Cognitive Complexity Drift
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  const ccd = Math.min(controlFlow / (totalLines * 0.15 + 1), 1);

  // ES - Explainability Score (higher = more explainable)
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgLen = identifiers.reduce((s, id) => s + id.length, 0) / (identifiers.length || 1);
  const es = Math.min(avgLen / 12, 1);

  // AES - AI Entropy Score (randomness in structure)
  const lineLengths = lines.map(l => l.length);
  const avgLineLen = lineLengths.reduce((s, l) => s + l, 0) / totalLines;
  const variance = lineLengths.reduce((s, l) => s + Math.pow(l - avgLineLen, 2), 0) / totalLines;
  const aes = Math.min(Math.sqrt(variance) / 40, 1);

  // RDI - Readability Degradation Index
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#')).length;
  const commentRatio = commentLines / totalLines;
  const rdi = commentRatio > 0.3 ? 0.8 : commentRatio < 0.05 ? 0.6 : 0.3;

  // DPS, DLI, DRF
  const dps = Math.round((techDebt * 0.6 + aiLikelihood * 0.4) * 100) / 100;
  const dli = Math.round((techDebt * 0.5 + ccd * 0.5) * 100) / 100;
  const drf = Math.round((aes * 0.4 + techDebt * 0.3 + aiLikelihood * 0.3) * 100) / 100;

  const cognitiveDebt = Math.round(Math.min((ccd * 0.3 + (1 - es) * 0.25 + aes * 0.25 + rdi * 0.2), 1) * 100) / 100;

  return {
    cognitiveDebt,
    metrics: {
      ccd: Math.round(ccd * 100) / 100,
      es: Math.round(es * 100) / 100,
      aes: Math.round(aes * 100) / 100,
      rdi: Math.round(rdi * 100) / 100,
      dps,
      dli,
      drf,
    },
  };
}

// --- Build Propagation Graph ---
function buildPropagationGraph(files: FileAnalysis[], fileContents: Map<string, string>): PropagationEdge[] {
  const edges: PropagationEdge[] = [];
  const filePaths = files.map(f => f.file);

  for (const file of files) {
    const content = fileContents.get(file.file) || '';
    // Detect imports
    const importMatches = content.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
    for (const imp of importMatches) {
      const target = imp.match(/['"]([^'"]+)['"]/)?.[1] || '';
      const resolved = filePaths.find(f => f.includes(target.replace(/^[.\/]+/, '').split('/').pop() || ''));
      if (resolved && resolved !== file.file) {
        edges.push({
          source: file.file,
          target: resolved,
          weight: Math.round((file.technicalDebt + file.aiLikelihood) / 2 * 100) / 100,
          type: 'import',
        });
      }
    }
  }

  // Add pattern-based edges for files with similar issues
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const shared = files[i].issues.filter(iss => files[j].issues.includes(iss));
      if (shared.length >= 2) {
        edges.push({
          source: files[i].file,
          target: files[j].file,
          weight: Math.round(shared.length / 5 * 100) / 100,
          type: 'pattern',
        });
      }
    }
  }

  return edges.slice(0, 30);
}

async function fetchRepoFiles(owner: string, repo: string, path = ''): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const items = await fetchGitHub(url);
  let files: GitHubFile[] = [];

  for (const item of items) {
    if (item.type === 'file' && isCodeFile(item.path)) {
      files.push(item);
    } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'vendor' && item.name !== 'dist' && item.name !== 'build') {
      if (files.length < 30) {
        try {
          const subFiles = await fetchRepoFiles(owner, repo, item.path);
          files = files.concat(subFiles);
        } catch { /* skip inaccessible dirs */ }
      }
    }
    if (files.length >= 30) break;
  }
  return files.slice(0, 30);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repoUrl } = await req.json();
    if (!repoUrl) throw new Error('repoUrl is required');

    const { owner, repo } = parseOwnerRepo(repoUrl);

    // Fetch repo info
    const repoInfo = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);

    // Fetch files
    const ghFiles = await fetchRepoFiles(owner, repo);
    if (ghFiles.length === 0) throw new Error('No code files found in repository');

    // Fetch file contents and analyze
    const fileContentsMap = new Map<string, string>();
    const fileAnalyses: FileAnalysis[] = [];

    const filePromises = ghFiles.map(async (ghFile) => {
      try {
        if (!ghFile.download_url) return null;
        const res = await fetch(ghFile.download_url);
        if (!res.ok) return null;
        const content = await res.text();
        if (content.length > 100000) return null; // skip very large files
        fileContentsMap.set(ghFile.path, content);

        const ai = detectAIPatterns(content);
        const tech = detectTechnicalDebt(content);
        const cog = detectCognitiveDebt(content, tech.technicalDebt, ai.aiLikelihood);

        const analysis: FileAnalysis = {
          file: ghFile.path,
          aiLikelihood: ai.aiLikelihood,
          technicalDebt: tech.technicalDebt,
          cognitiveDebt: cog.cognitiveDebt,
          propagationScore: cog.metrics.dps,
          issues: ai.issues,
          metrics: cog.metrics,
          linesOfCode: tech.linesOfCode,
          functions: tech.functions,
          cyclomaticComplexity: tech.cyclomaticComplexity,
          nestingDepth: tech.nestingDepth,
          aiDebtContribution: ai.aiDebtContribution,
        };
        return analysis;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    for (const r of results) {
      if (r) fileAnalyses.push(r);
    }

    if (fileAnalyses.length === 0) throw new Error('Could not analyze any files');

    // Build propagation graph
    const propagation = buildPropagationGraph(fileAnalyses, fileContentsMap);

    // Compute summary
    const n = fileAnalyses.length;
    const avgAiLikelihood = Math.round(fileAnalyses.reduce((s, f) => s + f.aiLikelihood, 0) / n * 100) / 100;
    const avgTechnicalDebt = Math.round(fileAnalyses.reduce((s, f) => s + f.technicalDebt, 0) / n * 100) / 100;
    const avgCognitiveDebt = Math.round(fileAnalyses.reduce((s, f) => s + f.cognitiveDebt, 0) / n * 100) / 100;

    const result = {
      repoName: `${owner}/${repo}`,
      totalFiles: n,
      stars: repoInfo.stargazers_count || 0,
      language: repoInfo.language || 'Unknown',
      files: fileAnalyses,
      propagation,
      summary: {
        avgAiLikelihood,
        avgTechnicalDebt,
        avgCognitiveDebt,
        totalIssues: fileAnalyses.reduce((s, f) => s + f.issues.length, 0),
        highRiskFiles: fileAnalyses.filter(f => f.aiLikelihood > 0.5 && f.technicalDebt > 0.4).length,
        topRefactorTargets: fileAnalyses
          .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
          .slice(0, 3)
          .map(f => f.file),
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
