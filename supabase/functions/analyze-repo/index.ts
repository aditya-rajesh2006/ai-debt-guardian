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

// ── ENHANCED AI PATTERN DETECTION ──
function detectAIPatterns(content: string, allContents?: string[]): {
  aiLikelihood: number; issues: string[]; aiDebtContribution: number;
} {
  const issues: string[] = [];
  let score = 0;
  const lines = content.split('\n');
  const totalLines = lines.length;

  // 1. Generic variable names (STRICT — lower threshold)
  const genericNames = content.match(/\b(temp|data|result|value|item|obj|arr|res|val|ret|tmp|output|input|helper|utils|foo|bar|baz|myVar|myFunction|myData|info|stuff|thing|element|node|entry|record|payload|response|request|handler|callback|args|params|options|config|settings|state|props|context|ref|el|str|num|idx|cnt|len|flag|status|type|kind|mode|key|id)\b/g);
  if (genericNames && genericNames.length > totalLines * 0.008) {
    score += 0.22;
    issues.push('overly generic naming');
  } else if (genericNames && genericNames.length > totalLines * 0.004) {
    score += 0.12;
    issues.push('partially generic naming');
  }

  // 2. Over-explained / obvious comments (STRICT — lower threshold)
  const commentLines = lines.filter(l => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('*');
  });
  const commentRatio = commentLines.length / totalLines;
  if (commentRatio > 0.20) { score += 0.18; issues.push('excessive comments'); }
  else if (commentRatio > 0.12) { score += 0.08; issues.push('high comment density'); }

  // 3. Comments that just restate code (obvious AI pattern)
  const obviousComments = commentLines.filter(l => {
    const t = l.trim().toLowerCase();
    return /\/\/ (get|set|create|initialize|check|return|call|loop|iterate|define|declare|update|delete|remove|add|increment|decrement|calculate|compute)\b/.test(t);
  });
  if (obviousComments.length > 3) { score += 0.1; issues.push('over-explained comments'); }

  // 4. Repetitive/duplicate code blocks (STRICT — 2+ identical lines)
  const lineFrequency = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (t.length > 12) lineFrequency.set(t, (lineFrequency.get(t) || 0) + 1);
  }
  const duplicated = [...lineFrequency.values()].filter(v => v >= 2).length;
  if (duplicated > 4) { score += 0.22; issues.push('duplicate code blocks'); }
  else if (duplicated > 1) { score += 0.10; issues.push('minor code duplication'); }

  // 5. Similar function structures (AI tends to repeat same pattern)
  const funcBodies = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\()[\s\S]{0,200}?}/g) || [];
  if (funcBodies.length >= 3) {
    const stripped = funcBodies.map(b => b.replace(/\s+/g, ' ').replace(/\w+/g, 'X'));
    const uniq = new Set(stripped).size;
    if (uniq / funcBodies.length < 0.6) { score += 0.15; issues.push('similar function structures'); }
  }

  // 6. Cross-file repetition
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

  // 7. Inconsistent naming (mix of camelCase, snake_case, PascalCase)
  const camel = content.match(/[a-z][A-Z]/g)?.length || 0;
  const snake = content.match(/[a-z]_[a-z]/g)?.length || 0;
  if (camel > 5 && snake > 5) { score += 0.1; issues.push('inconsistent naming conventions'); }

  // 8. Long parameter lists
  const longParams = content.match(/\([^)]{90,}\)/g);
  if (longParams && longParams.length > 2) { score += 0.07; issues.push('long parameter lists'); }

  // 9. Magic numbers
  const magicNums = content.match(/(?<![.\w])\d{2,}(?![.\w])/g);
  if (magicNums && magicNums.length > 6) { score += 0.06; issues.push('magic numbers'); }

  // 10. Missing error handling with async code
  const hasTryCatch = content.includes('try') && content.includes('catch');
  const hasAsync = content.includes('async') || content.includes('await') || content.includes('.then');
  if (hasAsync && !hasTryCatch) { score += 0.1; issues.push('missing error handling'); }

  // 11. Unnecessary abstraction – tiny single-use wrappers
  const wrappers = content.match(/(?:const|function)\s+\w+\s*=?\s*(?:\([^)]*\)\s*=>?\s*)?{[^}]{0,60}}/g) || [];
  const tinyFuncs = wrappers.filter(w => w.replace(/\s/g, '').length < 80).length;
  if (tinyFuncs > 4) { score += 0.08; issues.push('unnecessary abstraction'); }

  // 12. Uniform line lengths (AI code tends to have very consistent line lengths)
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const lineLens = nonEmptyLines.map(l => l.length);
  const avgLen = lineLens.reduce((s, l) => s + l, 0) / lineLens.length;
  const stdDev = Math.sqrt(lineLens.reduce((s, l) => s + Math.pow(l - avgLen, 2), 0) / lineLens.length);
  if (stdDev < 12 && nonEmptyLines.length > 20) { score += 0.12; issues.push('suspiciously uniform formatting'); }

  // 13. Perfect import organization (AI tends to perfectly group imports)
  const importLines = lines.filter(l => l.trim().startsWith('import '));
  if (importLines.length > 5) {
    const sorted = [...importLines].sort();
    if (JSON.stringify(importLines) === JSON.stringify(sorted)) {
      score += 0.06; issues.push('perfectly sorted imports');
    }
  }

  // 14. Excessive type annotations (TypeScript)
  const typeAnnotations = (content.match(/:\s*(string|number|boolean|any|void|never|undefined|null)\b/g) || []).length;
  if (typeAnnotations > totalLines * 0.05) { score += 0.08; issues.push('excessive type annotations'); }

  const aiLikelihood = Math.min(score + 0.08, 1);
  const aiDebtContribution = aiLikelihood > 0.4 ? 45 + aiLikelihood * 55 : 8 + aiLikelihood * 35;

  return {
    aiLikelihood: Math.round(aiLikelihood * 100) / 100,
    issues: [...new Set(issues)],
    aiDebtContribution: Math.round(aiDebtContribution),
  };
}

// ── ENHANCED TECHNICAL DEBT ──
function detectTechnicalDebt(content: string): {
  technicalDebt: number; cyclomaticComplexity: number; nestingDepth: number;
  linesOfCode: number; functions: number; techIssues: string[];
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

  // Long functions (> 50 lines between braces)
  const funcMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>?\s*)\{[\s\S]{2000,}?\}/g) || [];
  if (funcMatches.length > 0) { debt += 0.2 * Math.min(funcMatches.length, 3); techIssues.push('long functions (>50 lines)'); }

  // Large file (STRICT)
  if (linesOfCode > 300) { debt += 0.25; techIssues.push('large file (>300 LOC)'); }
  else if (linesOfCode > 200) { debt += 0.15; techIssues.push('growing file (>200 LOC)'); }
  else if (linesOfCode > 150) { debt += 0.05; }

  // Poor modularization – too many responsibilities heuristic
  const funcDecl = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g)?.length || 1;
  const functions = funcDecl;
  if (functions > 20) { debt += 0.1; techIssues.push('poor modularization'); }

  // Duplicate blocks (similar to AI detection but for tech debt)
  const blockPattern = content.match(/\{[^{}]{30,100}\}/g) || [];
  const blockFreq = new Map<string, number>();
  for (const b of blockPattern) {
    const k = b.replace(/\s+/g, ' ');
    blockFreq.set(k, (blockFreq.get(k) || 0) + 1);
  }
  const dupeBlocks = [...blockFreq.values()].filter(v => v > 2).length;
  if (dupeBlocks > 1) { debt += 0.15; techIssues.push('duplicate code blocks'); }

  // Missing modularization (one big function)
  const avgFuncLen = linesOfCode / Math.max(functions, 1);
  if (avgFuncLen > 40) { debt += 0.1; techIssues.push('missing modularization'); }

  return {
    technicalDebt: Math.round(Math.min(debt, 1) * 100) / 100,
    cyclomaticComplexity,
    nestingDepth: maxDepth,
    linesOfCode,
    functions,
    techIssues,
  };
}

// ── ENHANCED COGNITIVE DEBT ──
function detectCognitiveDebt(content: string, techDebt: number, aiLikelihood: number): {
  cognitiveDebt: number; metrics: FileAnalysis['metrics']; cogIssues: string[];
} {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const cogIssues: string[] = [];

  // CCD - Cognitive Complexity Drift
  const controlFlow = (content.match(/\b(if|else|for|while|do|switch|try|catch)\b/g) || []).length;
  const ccd = Math.min(controlFlow / (totalLines * 0.12 + 1), 1);
  if (ccd > 0.6) cogIssues.push('high cognitive complexity drift');

  // Variable naming clarity (avg identifier length – shorter = less clear)
  const identifiers = content.match(/\b[a-zA-Z_]\w{2,}\b/g) || [];
  const avgLen = identifiers.reduce((s, id) => s + id.length, 0) / (identifiers.length || 1);
  const es = Math.min(avgLen / 12, 1);
  if (avgLen < 5) cogIssues.push('poor variable naming clarity');

  // Comment usefulness: comments that just say what the code does
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#'));
  const uselessComments = commentLines.filter(l => {
    const t = l.toLowerCase();
    return /\/\/ (the|this|here|we|it|get|set|return|call|is|are|do|make|add|remove|update|create)\b/.test(t);
  }).length;
  const commentUsefulness = 1 - Math.min(uselessComments / Math.max(commentLines.length, 1), 1);
  if (commentUsefulness < 0.5) cogIssues.push('low comment usefulness');

  // Mixed abstraction levels – mixing high-level logic with implementation details
  const hasHighLevel = /\b(orchestrate|coordinate|manage|handle|process|workflow|pipeline)\b/i.test(content);
  const hasLowLevel = /\b(bit|byte|pointer|buffer|offset|malloc|free|raw|parse|serialize)\b/i.test(content);
  if (hasHighLevel && hasLowLevel) { cogIssues.push('mixed abstraction levels'); }

  // Inconsistent naming patterns (deep check)
  const camel = (content.match(/[a-z][A-Z]\w/g) || []).length;
  const snake = (content.match(/[a-z]_[a-z]/g) || []).length;
  const pascal = (content.match(/\b[A-Z][a-z]+[A-Z]/g) || []).length;
  const styles = [camel > 3, snake > 3, pascal > 3].filter(Boolean).length;
  if (styles > 2) cogIssues.push('inconsistent naming patterns');

  // AES – AI Entropy Score (structural variance)
  const lineLengths = lines.map(l => l.length);
  const avgLineLen = lineLengths.reduce((s, l) => s + l, 0) / totalLines;
  const variance = lineLengths.reduce((s, l) => s + Math.pow(l - avgLineLen, 2), 0) / totalLines;
  const aes = Math.min(Math.sqrt(variance) / 40, 1);

  // RDI – Readability Degradation Index
  const commentRatio = commentLines.length / totalLines;
  const rdi = commentRatio > 0.3 ? 0.8 : commentRatio < 0.05 ? 0.55 : 0.3;

  // Function readability score (shorter + well-named functions = better)
  const funcNames = content.match(/function\s+([a-zA-Z]\w+)/g) || [];
  const avgFuncNameLen = funcNames.reduce((s, f) => s + f.replace('function ', '').length, 0) / (funcNames.length || 1);
  const funcReadability = Math.min(avgFuncNameLen / 10, 1);
  if (avgFuncNameLen < 4) cogIssues.push('low function readability score');

  // DPS, DLI, DRF
  const dps = Math.round((techDebt * 0.6 + aiLikelihood * 0.4) * 100) / 100;
  const dli = Math.round((techDebt * 0.5 + ccd * 0.5) * 100) / 100;
  const drf = Math.round((aes * 0.4 + techDebt * 0.3 + aiLikelihood * 0.3) * 100) / 100;

  const cognitiveDebt = Math.round(
    Math.min((ccd * 0.25 + (1 - es) * 0.2 + aes * 0.2 + rdi * 0.15 + (1 - commentUsefulness) * 0.1 + (1 - funcReadability) * 0.1), 1) * 100
  ) / 100;

  return {
    cognitiveDebt,
    cogIssues,
    metrics: {
      ccd: Math.round(ccd * 100) / 100,
      es: Math.round(es * 100) / 100,
      aes: Math.round(aes * 100) / 100,
      rdi: Math.round(rdi * 100) / 100,
      dps, dli, drf,
    },
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
          source: file.file,
          target: resolved,
          weight: Math.round((file.technicalDebt + file.aiLikelihood) / 2 * 100) / 100,
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
          source: files[i].file,
          target: files[j].file,
          weight: Math.round(shared.length / 5 * 100) / 100,
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

    // Fetch all file contents first (needed for cross-file analysis)
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
    for (const r of contentResults) {
      if (r) fileContentsMap.set(r.path, r.content);
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

      fileAnalyses.push({
        file: ghFile.path,
        aiLikelihood: ai.aiLikelihood,
        technicalDebt: tech.technicalDebt,
        cognitiveDebt: cog.cognitiveDebt,
        propagationScore: cog.metrics.dps,
        issues: allIssues,
        metrics: cog.metrics,
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
