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

interface FileMetrics {
  ccd: number; es: number; aes: number; rdi: number; dps: number; dli: number; drf: number;
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
}

interface FileAnalysis {
  file: string;
  aiLikelihood: number;
  technicalDebt: number;
  cognitiveDebt: number;
  propagationScore: number;
  issues: string[];
  metrics: FileMetrics;
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

// ── IMPROVED AI DETECTION with SUS, TDD, PRI, CRS, SCS ──
function detectAIPatterns(content: string, allContents?: string[]): {
  aiLikelihood: number; issues: string[]; aiDebtContribution: number;
  sus: number; tdd: number; pri: number; crs: number; scs: number;
} {
  const issues: string[] = [];
  let score = 0;
  const lines = content.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);

  // ── SUS: Structural Uniformity Score ──
  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/\w+/g, 'X'));
    const uniq = new Set(stripped).size;
    sus = Math.round((1 - uniq / funcBodies.length) * 100) / 100;
    if (sus > 0.5) { score += 0.18; issues.push('high structural uniformity'); }
    else if (sus > 0.3) { score += 0.08; issues.push('moderate structural uniformity'); }
  }

  // ── TDD: Token Distribution Divergence ──
  // Human code has varied token distribution; AI tends to be uniform
  const tokens = content.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, 10).reduce((s, v) => s + v, 0);
  const totalTokens = tokens.length || 1;
  const tdd = Math.round(Math.min(topFreqSum / totalTokens, 1) * 100) / 100;
  // High TDD = few tokens dominate = more AI-like
  if (tdd > 0.3) { score += 0.1; issues.push('skewed token distribution'); }

  // ── PRI: Pattern Repetition Index ──
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 12) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  const pri = Math.round(Math.min(duplicated / Math.max(nonEmptyLines.length * 0.1, 1), 1) * 100) / 100;
  if (pri > 0.3) { score += 0.22; issues.push('high pattern repetition'); }
  else if (pri > 0.1) { score += 0.10; issues.push('minor pattern repetition'); }

  // ── CRS: Comment Redundancy Score ──
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*');
  });
  const obviousComments = commentLines.filter(l => {
    const t = l.trim().toLowerCase();
    return /\/\/ (get|set|create|initialize|check|return|call|loop|iterate|define|declare|update|delete|remove|add|increment|decrement|calculate|compute|import|export|render|handle|process|validate|parse|format|convert|transform|build|make|run|execute|start|stop|close|open|read|write|send|receive|fetch|load|save)\b/.test(t);
  });
  const crs = Math.round(Math.min(obviousComments.length / Math.max(commentLines.length, 1), 1) * 100) / 100;
  const commentRatio = commentLines.length / totalLines;
  if (crs > 0.5) { score += 0.15; issues.push('highly redundant comments'); }
  else if (crs > 0.3) { score += 0.06; issues.push('partially redundant comments'); }
  if (commentRatio > 0.20) { score += 0.12; issues.push('excessive comments'); }
  else if (commentRatio > 0.12) { score += 0.05; issues.push('high comment density'); }

  // ── SCS: Style Consistency Score ──
  // AI code has suspiciously uniform formatting
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / (lineLens.length || 1);
  const stdDev = Math.sqrt(lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / (lineLens.length || 1));
  const scs = Math.round(Math.max(0, 1 - stdDev / 30) * 100) / 100;
  if (scs > 0.7 && nonEmptyLines.length > 20) { score += 0.14; issues.push('suspiciously uniform formatting'); }
  else if (scs > 0.5 && nonEmptyLines.length > 15) { score += 0.06; issues.push('very consistent style'); }

  // ── Additional heuristics ──
  // Generic variable names
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|myFunction|myData|info|stuff|thing|element|node|entry|record|payload|response|request|handler|callback|args|params|options|config|settings|state|props|context|ref|el|str|num|idx|cnt|len|flag|status|type|kind|mode|key|id)\b/g);
  if (genericNames && genericNames.length > totalLines * 0.008) {
    score += 0.18; issues.push('overly generic naming');
  } else if (genericNames && genericNames.length > totalLines * 0.004) {
    score += 0.08; issues.push('partially generic naming');
  }

  // Cross-file repetition
  if (allContents && allContents.length > 1) {
    const chunks = content.match(/[\w\s,;(){}]{40,80}/g) || [];
    let crossFileMatches = 0;
    for (const chunk of chunks.slice(0, 20)) {
      for (const other of allContents) {
        if (other !== content && other.includes(chunk)) { crossFileMatches++; break; }
      }
    }
    if (crossFileMatches > 3) { score += 0.12; issues.push('repeated logic across files'); }
  }

  // Inconsistent naming conventions
  const camel = content.match(/[a-z][A-Z]/g)?.length || 0;
  const snake = content.match(/[a-z]_[a-z]/g)?.length || 0;
  if (camel > 5 && snake > 5) { score += 0.08; issues.push('inconsistent naming conventions'); }

  // Long parameter lists
  const longParams = content.match(/\([^)]{90,}\)/g);
  if (longParams && longParams.length > 2) { score += 0.06; issues.push('long parameter lists'); }

  // Magic numbers
  const magicNums = content.match(/(?<![.\w])\d{2,}(?![.\w])/g);
  if (magicNums && magicNums.length > 6) { score += 0.05; issues.push('magic numbers'); }

  // Missing error handling
  const hasTryCatch = content.includes('try') && content.includes('catch');
  const hasAsync = content.includes('async') || content.includes('await') || content.includes('.then');
  if (hasAsync && !hasTryCatch) { score += 0.1; issues.push('missing error handling'); }

  // Perfectly sorted imports
  const importLines = lines.filter(l => l.trim().startsWith('import '));
  if (importLines.length > 5) {
    const sorted = [...importLines].sort();
    if (JSON.stringify(importLines) === JSON.stringify(sorted)) {
      score += 0.06; issues.push('perfectly sorted imports');
    }
  }

  // Excessive type annotations
  const typeAnnotations = (content.match(/:\s*(string|number|boolean|any|void|never|undefined|null)\b/g) || []).length;
  if (typeAnnotations > totalLines * 0.05) { score += 0.07; issues.push('excessive type annotations'); }

  // ── FINAL AI % = weighted average of SUS, PRI, CRS, IAS (generic naming proxy), entropy ──
  const iasProxy = genericNames ? Math.min(genericNames.length / Math.max(totalLines * 0.01, 1), 1) : 0;
  const entropyProxy = 1 - (stdDev / 30);
  const weightedAI = (sus * 0.25 + pri * 0.2 + crs * 0.2 + iasProxy * 0.15 + Math.max(0, entropyProxy) * 0.2);

  const aiLikelihood = Math.min(Math.max(score + 0.05, weightedAI), 1);
  const aiDebtContribution = aiLikelihood > 0.4 ? 45 + aiLikelihood * 55 : 8 + aiLikelihood * 35;

  return {
    aiLikelihood: Math.round(aiLikelihood * 100) / 100,
    issues: [...new Set(issues)],
    aiDebtContribution: Math.round(aiDebtContribution),
    sus: Math.round(sus * 100) / 100,
    tdd: Math.round(tdd * 100) / 100,
    pri: Math.round(pri * 100) / 100,
    crs: Math.round(crs * 100) / 100,
    scs: Math.round(scs * 100) / 100,
  };
}

// ── ENHANCED TECHNICAL DEBT with advanced metrics ──
function detectTechnicalDebt(content: string): {
  technicalDebt: number; cyclomaticComplexity: number; nestingDepth: number;
  linesOfCode: number; functions: number; techIssues: string[];
  ddp: number; mds: number;
} {
  const lines = content.split('\n');
  const linesOfCode = lines.filter(l => l.trim().length > 0).length;
  const techIssues: string[] = [];
  let debt = 0;

  // Cyclomatic complexity
  const branches = (content.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/g) || []).length;
  const cyclomaticComplexity = 1 + branches;
  if (cyclomaticComplexity > 15) { debt += 0.30; techIssues.push('high cyclomatic complexity'); }
  else if (cyclomaticComplexity > 8) { debt += 0.18; techIssues.push('moderate cyclomatic complexity'); }
  else if (cyclomaticComplexity > 5) { debt += 0.06; }

  // Nesting depth
  let maxDepth = 0, depth = 0;
  for (const ch of content) {
    if (ch === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    if (ch === '}') depth--;
  }
  if (maxDepth > 4) { debt += 0.30; techIssues.push('deep nesting (>4 levels)'); }
  else if (maxDepth > 3) { debt += 0.18; techIssues.push('nesting at 4 levels'); }
  else if (maxDepth > 2) { debt += 0.06; }

  // Long functions
  const funcMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>?\s*)\{[\s\S]{2000,}?\}/g) || [];
  if (funcMatches.length > 0) { debt += 0.2 * Math.min(funcMatches.length, 3); techIssues.push('long functions (>50 lines)'); }

  // Large file
  if (linesOfCode > 300) { debt += 0.25; techIssues.push('large file (>300 LOC)'); }
  else if (linesOfCode > 200) { debt += 0.15; techIssues.push('growing file (>200 LOC)'); }
  else if (linesOfCode > 150) { debt += 0.05; }

  // Function count
  const funcDecl = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g)?.length || 1;
  const functions = funcDecl;
  if (functions > 20) { debt += 0.1; techIssues.push('poor modularization'); }

  // Duplicate blocks
  const blockPattern = content.match(/\{[^{}]{30,100}\}/g) || [];
  const blockFreq = new Map<string, number>();
  for (const b of blockPattern) {
    const k = b.replace(/\s+/g, ' ');
    blockFreq.set(k, (blockFreq.get(k) || 0) + 1);
  }
  const dupeBlocks = [...blockFreq.values()].filter(v => v > 2).length;
  if (dupeBlocks > 1) { debt += 0.15; techIssues.push('duplicate code blocks'); }

  // DDP: Defect Density Proxy = issues / LOC
  const issueCount = techIssues.length + (cyclomaticComplexity > 10 ? 2 : 0) + (maxDepth > 3 ? 1 : 0);
  const ddp = Math.round(Math.min(issueCount / Math.max(linesOfCode / 100, 1), 1) * 100) / 100;

  // MDS: Modularity Degradation Score = coupling / cohesion proxy
  const imports = (content.match(/import\s/g) || []).length;
  const exports = (content.match(/export\s/g) || []).length;
  const coupling = imports;
  const cohesion = Math.max(exports, 1);
  const mds = Math.round(Math.min(coupling / (cohesion * 3), 1) * 100) / 100;
  if (mds > 0.6) { debt += 0.1; techIssues.push('high coupling / low cohesion'); }

  return {
    technicalDebt: Math.round(Math.min(debt, 1) * 100) / 100,
    cyclomaticComplexity,
    nestingDepth: maxDepth,
    linesOfCode,
    functions,
    techIssues,
    ddp,
    mds,
  };
}

// ── ENHANCED COGNITIVE DEBT with advanced metrics ──
function detectCognitiveDebt(content: string, techDebt: number, aiLikelihood: number): {
  cognitiveDebt: number; metrics: Omit<FileMetrics, 'sus' | 'tdd' | 'pri' | 'crs' | 'scs' | 'cp' | 'ccn' | 'tc' | 'ddp' | 'mds'>; cogIssues: string[];
  cli: number; ias: number; ags: number; ri: number; csc: number;
} {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const cogIssues: string[] = [];

  // CCD
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  const ccd = Math.min(controlFlow / (totalLines * 0.12 + 1), 1);
  if (ccd > 0.6) cogIssues.push('high cognitive complexity drift');

  // ES - variable naming clarity
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgIdLen = identifiers.reduce((s, id) => s + id.length, 0) / (identifiers.length || 1);
  const es = Math.min(avgIdLen / 12, 1);
  if (avgIdLen < 5) cogIssues.push('poor variable naming clarity');

  // Comment usefulness
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#'));
  const uselessComments = commentLines.filter(l => {
    const t = l.toLowerCase();
    return /\/\/ (the|this|here|we|it|get|set|return|call|is|are|do|make|add|remove|update|create)\b/.test(t);
  }).length;
  const commentUsefulness = 1 - Math.min(uselessComments / Math.max(commentLines.length, 1), 1);
  if (commentUsefulness < 0.5) cogIssues.push('low comment usefulness');

  // Mixed abstraction levels
  const hasHighLevel = /\b(orchestrate|coordinate|manage|handle|process|workflow|pipeline)\b/i.test(content);
  const hasLowLevel = /\b(bit|byte|pointer|buffer|offset|malloc|free|raw|parse|serialize)\b/i.test(content);
  if (hasHighLevel && hasLowLevel) cogIssues.push('mixed abstraction levels');

  // AES
  const lineLengths = lines.map(l => l.length);
  const avgLineLen = lineLengths.reduce((s, l) => s + l, 0) / totalLines;
  const variance = lineLengths.reduce((s, l) => s + Math.pow(l - avgLineLen, 2), 0) / totalLines;
  const aes = Math.min(Math.sqrt(variance) / 40, 1);

  // RDI
  const commentRatio = commentLines.length / totalLines;
  const rdi = commentRatio > 0.3 ? 0.8 : commentRatio < 0.05 ? 0.55 : 0.3;

  // ── CLI: Cognitive Load Index ──
  let maxNesting = 0, nestDepth = 0;
  for (const ch of content) {
    if (ch === '{') { nestDepth++; maxNesting = Math.max(maxNesting, nestDepth); }
    if (ch === '}') nestDepth--;
  }
  const branchingFactor = controlFlow / Math.max(totalLines / 10, 1);
  const funcDecls = content.match(/function\s+\w+|=>\s*\{/g)?.length || 1;
  const avgFuncLength = totalLines / funcDecls;
  const cli = Math.round(Math.min((maxNesting + branchingFactor + avgFuncLength / 50) / 8, 1) * 100) / 100;
  if (cli > 0.7) cogIssues.push('high cognitive load index');

  // ── IAS: Identifier Ambiguity Score ──
  const allIds = content.match(/\b[a-zA-Z_]\w*\b/g) || [];
  const shortIds = allIds.filter(id => id.length <= 2 && !/^(if|do|in|of|to|or|is|as|it|at|on|up|by)$/i.test(id));
  const genericIds = allIds.filter(id => /^(data|result|value|item|temp|tmp|obj|arr|res|val|ret|info|stuff|thing|x|y|z|a|b|c|d|e|f|n|i|j|k)$/i.test(id));
  const ias = Math.round(Math.min((shortIds.length + genericIds.length) / Math.max(allIds.length * 0.1, 1), 1) * 100) / 100;
  if (ias > 0.5) cogIssues.push('high identifier ambiguity');

  // ── AGS: Abstraction Gap Score ──
  // Difference between function intent (name length/clarity) and implementation complexity
  const funcNames = content.match(/function\s+([a-zA-Z]\w+)/g) || [];
  const avgFuncNameLen = funcNames.reduce((s, f) => s + f.replace('function ', '').length, 0) / (funcNames.length || 1);
  const complexityPerFunc = controlFlow / funcDecls;
  const ags = Math.round(Math.min(Math.abs(complexityPerFunc / 5 - avgFuncNameLen / 15), 1) * 100) / 100;
  if (ags > 0.6) cogIssues.push('high abstraction gap');

  // ── RI: Readability Index ──
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const avgLL = nonEmptyLines.reduce((s, l) => s + l.length, 0) / (nonEmptyLines.length || 1);
  const namingScore = es;
  const ri = Math.round(Math.min((avgLL / 80 + maxNesting / 6 + (1 - namingScore)) / 3, 1) * 100) / 100;
  if (ri > 0.6) cogIssues.push('low readability index');

  // ── CSC: Context Switching Cost ──
  const imports = (content.match(/import\s/g) || []).length;
  const funcCalls = (content.match(/\w+\s*\(/g) || []).length;
  const csc = Math.round(Math.min((imports + funcCalls / 5) / 20, 1) * 100) / 100;
  if (csc > 0.7) cogIssues.push('high context switching cost');

  // DPS, DLI, DRF
  const dps = Math.round((techDebt * 0.6 + aiLikelihood * 0.4) * 100) / 100;
  const dli = Math.round((techDebt * 0.5 + ccd * 0.5) * 100) / 100;
  const drf = Math.round((aes * 0.4 + techDebt * 0.3 + aiLikelihood * 0.3) * 100) / 100;

  const cognitiveDebt = Math.round(
    Math.min((ccd * 0.15 + (1 - es) * 0.1 + aes * 0.1 + rdi * 0.1 + cli * 0.15 + ias * 0.1 + ags * 0.1 + ri * 0.1 + csc * 0.1), 1) * 100
  ) / 100;

  return {
    cognitiveDebt,
    cogIssues,
    metrics: { ccd: r(ccd), es: r(es), aes: r(aes), rdi: r(rdi), dps, dli, drf },
    cli, ias, ags, ri, csc,
  };
}

function r(v: number) { return Math.round(v * 100) / 100; }

// ── PROPAGATION GRAPH ──
function buildPropagationGraph(files: FileAnalysis[], fileContents: Map<string, string>): PropagationEdge[] {
  const edges: PropagationEdge[] = [];
  const filePaths = files.map(f => f.file);

  for (const file of files) {
    const content = fileContents.get(file.file) || '';
    const importMatches = content.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
    for (const imp of importMatches) {
      const target = imp.match(/['"]([^'"]+)['"]/)?.[1] || '';
      const resolved = filePaths.find(f => f.includes(target.replace(/^[.\/]+/, '').split('/').pop() || ''));
      if (resolved && resolved !== file.file) {
        edges.push({
          source: file.file, target: resolved,
          weight: r((file.technicalDebt + file.aiLikelihood) / 2),
          type: 'import',
        });
      }
    }
  }

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const shared = files[i].issues.filter(iss => files[j].issues.includes(iss));
      if (shared.length >= 2) {
        edges.push({
          source: files[i].file, target: files[j].file,
          weight: r(shared.length / 5),
          type: 'pattern',
        });
      }
    }
  }

  return edges.slice(0, 35);
}

async function fetchRepoFiles(owner: string, repo: string, path = ''): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const items = await fetchGitHub(url);
  let files: GitHubFile[] = [];

  for (const item of items) {
    if (item.type === 'file' && isCodeFile(item.path) && item.size < 200000) {
      files.push(item);
    } else if (item.type === 'dir' && !item.name.startsWith('.') &&
      !['node_modules', 'vendor', 'dist', 'build', '.git', '__pycache__', 'coverage'].includes(item.name)) {
      if (files.length < 40) {
        try {
          const subFiles = await fetchRepoFiles(owner, repo, item.path);
          files = files.concat(subFiles);
        } catch { /* skip */ }
      }
    }
    if (files.length >= 40) break;
  }
  return files.slice(0, 40);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { repoUrl } = await req.json();
    if (!repoUrl) throw new Error('repoUrl is required');

    const { owner, repo } = parseOwnerRepo(repoUrl);
    const repoInfo = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
    const ghFiles = await fetchRepoFiles(owner, repo);
    if (ghFiles.length === 0) throw new Error('No code files found in repository');

    const fileContentsMap = new Map<string, string>();

    const contentFetches = ghFiles.map(async (ghFile) => {
      try {
        if (!ghFile.download_url) return null;
        const res = await fetch(ghFile.download_url);
        if (!res.ok) return null;
        const content = await res.text();
        if (content.length > 120000) return null;
        return { path: ghFile.path, content };
      } catch { return null; }
    });

    const contentResults = await Promise.all(contentFetches);
    for (const cr of contentResults) {
      if (cr) fileContentsMap.set(cr.path, cr.content);
    }

    const allContents = [...fileContentsMap.values()];
    const fileAnalyses: FileAnalysis[] = [];

    for (const ghFile of ghFiles) {
      const content = fileContentsMap.get(ghFile.path);
      if (!content) continue;

      const ai = detectAIPatterns(content, allContents);
      const tech = detectTechnicalDebt(content);
      const cog = detectCognitiveDebt(content, tech.technicalDebt, ai.aiLikelihood);

      const allIssues = [...new Set([...ai.issues, ...tech.techIssues, ...cog.cogIssues])];

      // CP, CCN, TC are commit-based — approximate from static analysis
      const cp = r(Math.min(allIssues.length / 8, 1)); // proxy
      const ccn = tech.linesOfCode; // proxy: total LOC as churn
      const tc = r(Math.min((cp * tech.cyclomaticComplexity) / 10, 1));

      fileAnalyses.push({
        file: ghFile.path,
        aiLikelihood: ai.aiLikelihood,
        technicalDebt: tech.technicalDebt,
        cognitiveDebt: cog.cognitiveDebt,
        propagationScore: cog.metrics.dps,
        issues: allIssues,
        metrics: {
          ...cog.metrics,
          cp, ccn, tc,
          ddp: tech.ddp,
          mds: tech.mds,
          cli: cog.cli,
          ias: cog.ias,
          ags: cog.ags,
          ri: cog.ri,
          csc: cog.csc,
          sus: ai.sus,
          tdd: ai.tdd,
          pri: ai.pri,
          crs: ai.crs,
          scs: ai.scs,
        },
        linesOfCode: tech.linesOfCode,
        functions: tech.functions,
        cyclomaticComplexity: tech.cyclomaticComplexity,
        nestingDepth: tech.nestingDepth,
        aiDebtContribution: ai.aiDebtContribution,
      });
    }

    if (fileAnalyses.length === 0) throw new Error('Could not analyze any files');

    const propagation = buildPropagationGraph(fileAnalyses, fileContentsMap);

    const n = fileAnalyses.length;
    const avgAiLikelihood = r(fileAnalyses.reduce((s, f) => s + f.aiLikelihood, 0) / n);
    const avgTechnicalDebt = r(fileAnalyses.reduce((s, f) => s + f.technicalDebt, 0) / n);
    const avgCognitiveDebt = r(fileAnalyses.reduce((s, f) => s + f.cognitiveDebt, 0) / n);

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
        topRefactorTargets: [...fileAnalyses]
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
