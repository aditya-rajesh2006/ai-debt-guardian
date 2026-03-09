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
  cp: number; ccn: number; tc: number; ddp: number; mds: number;
  // Research-backed Technical
  tdr: number;   // Technical Debt Ratio
  mi: number;    // Maintainability Index
  hv: number;    // Halstead Volume
  hd: number;    // Halstead Difficulty
  he: number;    // Halstead Effort
  cbo: number;   // Coupling Between Objects
  chs: number;   // Code Health Score
  dpf: number;   // Debt Propagation Factor
  dsr: number;   // Debt Spread Rate
  dupRatio: number; // Code Duplication Ratio
  // Advanced Cognitive
  cli: number; ias: number; ags: number; ri: number; csc: number;
  // AI Detection
  sus: number; tdd: number; pri: number; crs: number; scs: number;
  // AI multi-signal model
  aiScore: number;      // Final weighted AI probability
  perplexityScore: number;
  namingRegularity: number;
  commentDensity: number;
  templateSimilarity: number;
  commitBurstScore: number;
  formatConsistency: number;
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

async function fetchGitHub(url: string, token?: string) {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'AIDebtTracker' };
  const t = token || GITHUB_TOKEN;
  if (t) headers['Authorization'] = `token ${t}`;
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

function r(v: number) { return Math.round(v * 100) / 100; }

// ── HALSTEAD COMPLEXITY ──
function computeHalstead(content: string) {
  const operators = content.match(/[+\-*/%=<>!&|^~?:;,.()\[\]{}]/g) || [];
  const operands = content.match(/\b[a-zA-Z_]\w*\b/g) || [];
  const uniqueOps = new Set(operators).size || 1;
  const uniqueOpds = new Set(operands).size || 1;
  const N = operators.length + operands.length;
  const n = uniqueOps + uniqueOpds;
  const volume = N * Math.log2(n || 2);
  const difficulty = (uniqueOps / 2) * (operands.length / (uniqueOpds || 1));
  const effort = volume * difficulty;
  return { hv: r(Math.min(volume / 10000, 1)), hd: r(Math.min(difficulty / 100, 1)), he: r(Math.min(effort / 500000, 1)), rawVolume: volume };
}

// ── MAINTAINABILITY INDEX ──
function computeMI(halsteadVolume: number, cyclomaticComplexity: number, linesOfCode: number): number {
  // MI = 171 − 5.2 ln(HV) − 0.23 CC − 16.2 ln(LOC)
  const hv = Math.max(halsteadVolume, 1);
  const loc = Math.max(linesOfCode, 1);
  const mi = 171 - 5.2 * Math.log(hv) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(loc);
  // Normalize to 0-1 (0=poor, 1=excellent). MI typically 0-171
  return r(Math.max(Math.min(mi / 171, 1), 0));
}

// ── CODE DUPLICATION RATIO ──
function computeDuplicationRatio(content: string): number {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const freq = new Map<string, number>();
  for (const l of lines) freq.set(l, (freq.get(l) || 0) + 1);
  const duplicated = [...freq.entries()].filter(([, c]) => c > 1).reduce((s, [, c]) => s + c, 0);
  return r(Math.min(duplicated / Math.max(lines.length, 1), 1));
}

// ── AI DETECTION: Multi-Signal Heuristic Model ──
function detectAIPatterns(content: string, allContents?: string[]): {
  aiLikelihood: number; issues: string[]; aiDebtContribution: number;
  sus: number; tdd: number; pri: number; crs: number; scs: number;
  aiScore: number; perplexityScore: number; namingRegularity: number;
  commentDensity: number; templateSimilarity: number; formatConsistency: number;
} {
  const issues: string[] = [];
  const lines = content.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);

  // ── SUS: Structural Uniformity Score ──
  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,300}?}/g) || [];
  let sus = 0;
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/\w+/g, 'X'));
    const uniq = new Set(stripped).size;
    sus = r(1 - uniq / funcBodies.length);
    if (sus > 0.5) { issues.push('high structural uniformity'); }
    else if (sus > 0.3) { issues.push('moderate structural uniformity'); }
  }

  // ── TDD: Token Distribution Divergence ──
  const tokens = content.match(/\b\w+\b/g) || [];
  const tokenFreq = new Map<string, number>();
  for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
  const freqs = [...tokenFreq.values()].sort((a, b) => b - a);
  const topFreqSum = freqs.slice(0, 10).reduce((s, v) => s + v, 0);
  const totalTokens = tokens.length || 1;
  const tdd = r(Math.min(topFreqSum / totalTokens, 1));
  if (tdd > 0.3) { issues.push('skewed token distribution'); }

  // ── PRI: Pattern Repetition Index ──
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 12) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  const pri = r(Math.min(duplicated / Math.max(nonEmptyLines.length * 0.1, 1), 1));
  if (pri > 0.3) { issues.push('high pattern repetition'); }
  else if (pri > 0.1) { issues.push('minor pattern repetition'); }

  // ── CRS: Comment Redundancy Score ──
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*');
  });
  const obviousComments = commentLines.filter(l => {
    const t = l.trim().toLowerCase();
    return /\/\/ (get|set|create|initialize|check|return|call|loop|iterate|define|declare|update|delete|remove|add|increment|decrement|calculate|compute|import|export|render|handle|process|validate|parse|format|convert|transform|build|make|run|execute|start|stop|close|open|read|write|send|receive|fetch|load|save)\b/.test(t);
  });
  const crs = r(Math.min(obviousComments.length / Math.max(commentLines.length, 1), 1));
  const commentRatio = commentLines.length / totalLines;
  if (crs > 0.5) { issues.push('highly redundant comments'); }
  else if (crs > 0.3) { issues.push('partially redundant comments'); }
  if (commentRatio > 0.20) { issues.push('excessive comments'); }
  else if (commentRatio > 0.12) { issues.push('high comment density'); }

  // ── SCS: Style Consistency Score ──
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / (lineLens.length || 1);
  const stdDev = Math.sqrt(lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / (lineLens.length || 1));
  const scs = r(Math.max(0, 1 - stdDev / 30));
  if (scs > 0.7 && nonEmptyLines.length > 20) { issues.push('suspiciously uniform formatting'); }
  else if (scs > 0.5 && nonEmptyLines.length > 15) { issues.push('very consistent style'); }

  // ── Perplexity Score (proxy: lower entropy = more AI-like) ──
  const perplexityScore = r(Math.max(0, 1 - stdDev / 40));

  // ── Naming Regularity (verbose descriptive names = AI) ──
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgIdLen = identifiers.reduce((s, id) => s + id.length, 0) / (identifiers.length || 1);
  const namingRegularity = r(Math.min(avgIdLen / 20, 1));
  if (avgIdLen > 15) { issues.push('overly descriptive naming'); }

  // ── Comment Density ──
  const commentDensityVal = r(Math.min(commentRatio / 0.3, 1));

  // ── Template Similarity (boilerplate detection) ──
  const boilerplatePatterns = [
    /try\s*\{[\s\S]{0,200}catch\s*\(\w+\)\s*\{[\s\S]{0,100}(printStackTrace|console\.error|throw)/g,
    /if\s*\(\w+\s*[!=]==?\s*(null|undefined)\)\s*\{?\s*(throw|return)/g,
    /export\s+default\s+function\s+\w+/g,
  ];
  let templateMatches = 0;
  for (const p of boilerplatePatterns) {
    templateMatches += (content.match(p) || []).length;
  }
  const templateSimilarity = r(Math.min(templateMatches / 5, 1));

  // ── Format Consistency (low variance = AI) ──
  const formatConsistency = scs;

  // ── Generic variable names ──
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|myFunction|myData|info|stuff|thing|element|node|entry|record|payload|response|request|handler|callback|args|params|options|config|settings|state|props|context|ref|el|str|num|idx|cnt|len|flag|status|type|kind|mode|key|id)\b/g);
  const iasProxy = genericNames ? Math.min(genericNames.length / Math.max(totalLines * 0.01, 1), 1) : 0;
  if (genericNames && genericNames.length > totalLines * 0.008) {
    issues.push('overly generic naming');
  } else if (genericNames && genericNames.length > totalLines * 0.004) {
    issues.push('partially generic naming');
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
    if (crossFileMatches > 3) { issues.push('repeated logic across files'); }
  }

  // Inconsistent naming conventions
  const camel = content.match(/[a-z][A-Z]/g)?.length || 0;
  const snake = content.match(/[a-z]_[a-z]/g)?.length || 0;
  if (camel > 5 && snake > 5) { issues.push('inconsistent naming conventions'); }

  // Long parameter lists
  const longParams = content.match(/\([^)]{90,}\)/g);
  if (longParams && longParams.length > 2) { issues.push('long parameter lists'); }

  // Magic numbers
  const magicNums = content.match(/(?<![.\w])\d{2,}(?![.\w])/g);
  if (magicNums && magicNums.length > 6) { issues.push('magic numbers'); }

  // Missing error handling
  const hasTryCatch = content.includes('try') && content.includes('catch');
  const hasAsync = content.includes('async') || content.includes('await') || content.includes('.then');
  if (hasAsync && !hasTryCatch) { issues.push('missing error handling'); }

  // Perfectly sorted imports
  const importLines = lines.filter(l => l.trim().startsWith('import '));
  if (importLines.length > 5) {
    const sorted = [...importLines].sort();
    if (JSON.stringify(importLines) === JSON.stringify(sorted)) {
      issues.push('perfectly sorted imports');
    }
  }

  // Excessive type annotations
  const typeAnnotations = (content.match(/:\s*(string|number|boolean|any|void|never|undefined|null)\b/g) || []).length;
  if (typeAnnotations > totalLines * 0.05) { issues.push('excessive type annotations'); }

  // Commit burst score (proxy from static: large file = likely bulk-generated)
  const commitBurstScore = r(Math.min(totalLines / 300, 1));

  // ── FINAL AI SCORE: Research-backed multi-signal weighted model ──
  // AI_Score = w1*Pstyle + w2*Pstructure + w3*Pcommit + w4*Pduplication + w5*Pperplexity
  const aiScore = r(
    perplexityScore * 0.15 +
    namingRegularity * 0.15 +
    commentDensityVal * 0.10 +
    templateSimilarity * 0.15 +
    commitBurstScore * 0.10 +
    sus * 0.15 +
    formatConsistency * 0.10 +
    pri * 0.10
  );

  // Legacy score for backward compat
  let legacyScore = 0;
  if (sus > 0.5) legacyScore += 0.18;
  else if (sus > 0.3) legacyScore += 0.08;
  if (tdd > 0.3) legacyScore += 0.1;
  if (pri > 0.3) legacyScore += 0.22;
  else if (pri > 0.1) legacyScore += 0.10;
  if (crs > 0.5) legacyScore += 0.15;
  else if (crs > 0.3) legacyScore += 0.06;
  if (commentRatio > 0.20) legacyScore += 0.12;
  else if (commentRatio > 0.12) legacyScore += 0.05;
  if (scs > 0.7 && nonEmptyLines.length > 20) legacyScore += 0.14;
  else if (scs > 0.5 && nonEmptyLines.length > 15) legacyScore += 0.06;
  if (genericNames && genericNames.length > totalLines * 0.008) legacyScore += 0.18;
  else if (genericNames && genericNames.length > totalLines * 0.004) legacyScore += 0.08;
  if (hasAsync && !hasTryCatch) legacyScore += 0.1;

  const aiLikelihood = Math.min(Math.max(legacyScore + 0.05, aiScore), 1);
  const aiDebtContribution = aiLikelihood > 0.4 ? 45 + aiLikelihood * 55 : 8 + aiLikelihood * 35;

  return {
    aiLikelihood: r(aiLikelihood),
    issues: [...new Set(issues)],
    aiDebtContribution: Math.round(aiDebtContribution),
    sus, tdd, pri, crs, scs,
    aiScore, perplexityScore, namingRegularity,
    commentDensity: commentDensityVal, templateSimilarity, formatConsistency,
  };
}

// ── ENHANCED TECHNICAL DEBT ──
function detectTechnicalDebt(content: string): {
  technicalDebt: number; cyclomaticComplexity: number; nestingDepth: number;
  linesOfCode: number; functions: number; techIssues: string[];
  ddp: number; mds: number; dupRatio: number;
  hv: number; hd: number; he: number; rawHV: number; cbo: number;
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

  // DDP
  const issueCount = techIssues.length + (cyclomaticComplexity > 10 ? 2 : 0) + (maxDepth > 3 ? 1 : 0);
  const ddp = r(Math.min(issueCount / Math.max(linesOfCode / 100, 1), 1));

  // MDS
  const imports = (content.match(/import\s/g) || []).length;
  const exports = (content.match(/export\s/g) || []).length;
  const coupling = imports;
  const cohesion = Math.max(exports, 1);
  const mds = r(Math.min(coupling / (cohesion * 3), 1));
  if (mds > 0.6) { debt += 0.1; techIssues.push('high coupling / low cohesion'); }

  // CBO: Coupling Between Objects
  const cbo = r(Math.min(imports / 15, 1));
  if (cbo > 0.6) { techIssues.push('high coupling between objects'); }

  // Duplication ratio
  const dupRatio = computeDuplicationRatio(content);
  if (dupRatio > 0.1) { techIssues.push('high code duplication ratio'); }

  // Halstead
  const halstead = computeHalstead(content);

  return {
    technicalDebt: r(Math.min(debt, 1)),
    cyclomaticComplexity, nestingDepth: maxDepth, linesOfCode, functions, techIssues,
    ddp, mds, dupRatio, cbo,
    ...halstead, rawHV: halstead.hv * 10000,
  };
}

// ── COGNITIVE DEBT ──
function detectCognitiveDebt(content: string, techDebt: number, aiLikelihood: number): {
  cognitiveDebt: number; metrics: Pick<FileMetrics, 'ccd' | 'es' | 'aes' | 'rdi' | 'dps' | 'dli' | 'drf'>; cogIssues: string[];
  cli: number; ias: number; ags: number; ri: number; csc: number;
} {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const cogIssues: string[] = [];

  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  const ccd = Math.min(controlFlow / (totalLines * 0.12 + 1), 1);
  if (ccd > 0.6) cogIssues.push('high cognitive complexity drift');

  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgIdLen = identifiers.reduce((s, id) => s + id.length, 0) / (identifiers.length || 1);
  const es = Math.min(avgIdLen / 12, 1);
  if (avgIdLen < 5) cogIssues.push('poor variable naming clarity');

  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#'));
  const uselessComments = commentLines.filter(l => {
    const t = l.toLowerCase();
    return /\/\/ (the|this|here|we|it|get|set|return|call|is|are|do|make|add|remove|update|create)\b/.test(t);
  }).length;
  const commentUsefulness = 1 - Math.min(uselessComments / Math.max(commentLines.length, 1), 1);
  if (commentUsefulness < 0.5) cogIssues.push('low comment usefulness');

  const hasHighLevel = /\b(orchestrate|coordinate|manage|handle|process|workflow|pipeline)\b/i.test(content);
  const hasLowLevel = /\b(bit|byte|pointer|buffer|offset|malloc|free|raw|parse|serialize)\b/i.test(content);
  if (hasHighLevel && hasLowLevel) cogIssues.push('mixed abstraction levels');

  const lineLengths = lines.map(l => l.length);
  const avgLineLen = lineLengths.reduce((s, l) => s + l, 0) / totalLines;
  const variance = lineLengths.reduce((s, l) => s + Math.pow(l - avgLineLen, 2), 0) / totalLines;
  const aes = Math.min(Math.sqrt(variance) / 40, 1);

  const commentRatio = commentLines.length / totalLines;
  const rdi = commentRatio > 0.3 ? 0.8 : commentRatio < 0.05 ? 0.55 : 0.3;

  // CLI
  let maxNesting = 0, nestDepth = 0;
  for (const ch of content) {
    if (ch === '{') { nestDepth++; maxNesting = Math.max(maxNesting, nestDepth); }
    if (ch === '}') nestDepth--;
  }
  const branchingFactor = controlFlow / Math.max(totalLines / 10, 1);
  const funcDecls = content.match(/function\s+\w+|=>\s*\{/g)?.length || 1;
  const avgFuncLength = totalLines / funcDecls;
  const cli = r(Math.min((maxNesting + branchingFactor + avgFuncLength / 50) / 8, 1));
  if (cli > 0.7) cogIssues.push('high cognitive load index');

  // IAS
  const allIds = content.match(/\b[a-zA-Z_]\w*\b/g) || [];
  const shortIds = allIds.filter(id => id.length <= 2 && !/^(if|do|in|of|to|or|is|as|it|at|on|up|by)$/i.test(id));
  const genericIds = allIds.filter(id => /^(data|result|value|item|temp|tmp|obj|arr|res|val|ret|info|stuff|thing|x|y|z|a|b|c|d|e|f|n|i|j|k)$/i.test(id));
  const ias = r(Math.min((shortIds.length + genericIds.length) / Math.max(allIds.length * 0.1, 1), 1));
  if (ias > 0.5) cogIssues.push('high identifier ambiguity');

  // AGS
  const funcNames = content.match(/function\s+([a-zA-Z]\w+)/g) || [];
  const avgFuncNameLen = funcNames.reduce((s, f) => s + f.replace('function ', '').length, 0) / (funcNames.length || 1);
  const complexityPerFunc = controlFlow / funcDecls;
  const ags = r(Math.min(Math.abs(complexityPerFunc / 5 - avgFuncNameLen / 15), 1));
  if (ags > 0.6) cogIssues.push('high abstraction gap');

  // RI
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const avgLL = nonEmptyLines.reduce((s, l) => s + l.length, 0) / (nonEmptyLines.length || 1);
  const ri = r(Math.min((avgLL / 80 + maxNesting / 6 + (1 - es)) / 3, 1));
  if (ri > 0.6) cogIssues.push('low readability index');

  // CSC
  const imports = (content.match(/import\s/g) || []).length;
  const funcCalls = (content.match(/\w+\s*\(/g) || []).length;
  const csc = r(Math.min((imports + funcCalls / 5) / 20, 1));
  if (csc > 0.7) cogIssues.push('high context switching cost');

  const dps = r((techDebt * 0.6 + aiLikelihood * 0.4));
  const dli = r((techDebt * 0.5 + ccd * 0.5));
  const drf = r((aes * 0.4 + techDebt * 0.3 + aiLikelihood * 0.3));

  const cognitiveDebt = r(
    Math.min((ccd * 0.15 + (1 - es) * 0.1 + aes * 0.1 + rdi * 0.1 + cli * 0.15 + ias * 0.1 + ags * 0.1 + ri * 0.1 + csc * 0.1), 1)
  );

  return {
    cognitiveDebt, cogIssues,
    metrics: { ccd: r(ccd), es: r(es), aes: r(aes), rdi: r(rdi), dps, dli, drf },
    cli, ias, ags, ri, csc,
  };
}

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

async function fetchRepoFiles(owner: string, repo: string, token?: string, path = ''): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const items = await fetchGitHub(url, token);
  let files: GitHubFile[] = [];

  for (const item of items) {
    if (item.type === 'file' && isCodeFile(item.path) && item.size < 200000) {
      files.push(item);
    } else if (item.type === 'dir' && !item.name.startsWith('.') &&
      !['node_modules', 'vendor', 'dist', 'build', '.git', '__pycache__', 'coverage'].includes(item.name)) {
      if (files.length < 40) {
        try {
          const subFiles = await fetchRepoFiles(owner, repo, token, item.path);
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
    const { repoUrl, githubToken } = await req.json();
    if (!repoUrl) throw new Error('repoUrl is required');

    const effectiveToken = githubToken || GITHUB_TOKEN;
    const { owner, repo } = parseOwnerRepo(repoUrl);
    const repoInfo = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`, effectiveToken);
    const ghFiles = await fetchRepoFiles(owner, repo, effectiveToken);
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

      // CP, CCN, TC proxies
      const cp = r(Math.min(allIssues.length / 8, 1));
      const ccn = tech.linesOfCode;
      const tc = r(Math.min((cp * tech.cyclomaticComplexity) / 10, 1));

      // TDR: Technical Debt Ratio = remediation cost / development cost
      // Proxy: debt score × issue density
      const tdr = r(Math.min(tech.technicalDebt * (1 + allIssues.length / 10), 1));

      // MI: Maintainability Index
      const mi = computeMI(tech.rawHV, tech.cyclomaticComplexity, tech.linesOfCode);

      // CHS: Code Health Score (1-10, inverted to 0-1 where 1=poor)
      const healthRaw = 10 - (tech.technicalDebt * 4 + cog.cognitiveDebt * 3 + ai.aiLikelihood * 3);
      const chs = r(Math.max(Math.min(healthRaw / 10, 1), 0));

      // DPF and DSR computed at summary level but stored per-file as proxy
      const dpf = r(cog.metrics.dps);
      const dsr = r(Math.min(allIssues.length / 12, 1));

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
          ddp: tech.ddp, mds: tech.mds,
          tdr, mi, hv: tech.hv, hd: tech.hd, he: tech.he,
          cbo: tech.cbo, chs, dpf, dsr, dupRatio: tech.dupRatio,
          cli: cog.cli, ias: cog.ias, ags: cog.ags, ri: cog.ri, csc: cog.csc,
          sus: ai.sus, tdd: ai.tdd, pri: ai.pri, crs: ai.crs, scs: ai.scs,
          aiScore: ai.aiScore,
          perplexityScore: ai.perplexityScore,
          namingRegularity: ai.namingRegularity,
          commentDensity: ai.commentDensity,
          templateSimilarity: ai.templateSimilarity,
          commitBurstScore: 0, // will be set from commit analysis
          formatConsistency: ai.formatConsistency,
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

    // Summary-level propagation metrics
    const highDebtFiles = fileAnalyses.filter(f => f.technicalDebt > 0.4).length;
    const debtAffectedFiles = new Set(propagation.filter(e =>
      fileAnalyses.find(f => f.file === e.source && f.technicalDebt > 0.4)
    ).map(e => e.target)).size;
    const summaryDPF = r(highDebtFiles > 0 ? debtAffectedFiles / highDebtFiles : 0);
    const debtRelatedCommitProxy = fileAnalyses.filter(f => f.technicalDebt > 0.3).length;
    const summaryDSR = r(Math.min(debtRelatedCommitProxy / n, 1));

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
        dpf: summaryDPF,
        dsr: summaryDSR,
        avgMI: r(fileAnalyses.reduce((s, f) => s + f.metrics.mi, 0) / n),
        avgCHS: r(fileAnalyses.reduce((s, f) => s + f.metrics.chs, 0) / n),
        avgTDR: r(fileAnalyses.reduce((s, f) => s + f.metrics.tdr, 0) / n),
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
