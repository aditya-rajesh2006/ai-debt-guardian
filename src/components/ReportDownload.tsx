import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, FileCode } from "lucide-react";
import type { AnalysisResult } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

function generateMarkdownReport(data: AnalysisResult): string {
  const s = data.summary;
  const topFiles = [...data.files]
    .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
    .slice(0, 5);

  const totalTech = data.files.reduce((s, f) => s + f.technicalDebt, 0);
  const totalCog = data.files.reduce((s, f) => s + f.cognitiveDebt, 0);
  const aiTech = data.files.reduce((s, f) => s + f.technicalDebt * f.aiLikelihood, 0);
  const aiCog = data.files.reduce((s, f) => s + f.cognitiveDebt * f.aiLikelihood, 0);
  const aiTechPct = totalTech > 0 ? Math.round(aiTech / totalTech * 100) : 0;
  const aiCogPct = totalCog > 0 ? Math.round(aiCog / totalCog * 100) : 0;

  const topAIFiles = [...data.files]
    .sort((a, b) => b.aiDebtContribution - a.aiDebtContribution)
    .slice(0, 5);

  const avgMetrics = data.files.reduce(
    (acc, f) => {
      for (const k of Object.keys(f.metrics) as (keyof typeof f.metrics)[]) {
        acc[k] = (acc[k] || 0) + f.metrics[k];
      }
      return acc;
    },
    {} as Record<string, number>
  );
  for (const k of Object.keys(avgMetrics)) {
    avgMetrics[k] = Math.round((avgMetrics[k] / data.files.length) * 100) / 100;
  }

  const aiFilesSection = topAIFiles.map((f, i) => {
    const model = f.modelAttribution?.model_id ?? 'N/A';
    const conf = ((f.modelAttribution?.confidence ?? 0) * 100).toFixed(0);
    const aiTD = (f.aiTechnicalDebt * 100).toFixed(0);
    const aiCD = (f.aiCognitiveDebt * 100).toFixed(0);
    return `${i + 1}. **${f.file}** — AI Debt: ${f.aiDebtContribution}%, AI: ${(f.aiLikelihood * 100).toFixed(0)}%, Model: ${model} (${conf}%)\n   - AI Tech Debt: ${aiTD}%, AI Cog Debt: ${aiCD}%\n   - Issues: ${f.issues.join(', ')}`;
  }).join('\n');

  const riskFilesSection = topFiles.map((f, i) =>
    `${i + 1}. **${f.file}** — AI: ${(f.aiLikelihood * 100).toFixed(0)}%, Tech: ${(f.technicalDebt * 100).toFixed(0)}%, Cog: ${(f.cognitiveDebt * 100).toFixed(0)}%\n   - Issues: ${f.issues.join(', ')}`
  ).join('\n');

  const recsSection = s.topRefactorTargets.map((f, i) =>
    `${i + 1}. Refactor \`${f}\` — highest combined debt`
  ).join('\n');

  return `# 🤖 AI-Induced Debt Analysis Report: ${data.repoName}

> This report focuses on identifying and measuring technical & cognitive debt specifically caused by AI-generated code.

## 🎯 AI Debt Summary
| Metric | Value |
|--------|-------|
| AI-Generated Code | ${(s.avgAiLikelihood * 100).toFixed(1)}% |
| AI → Technical Debt | ${aiTechPct}% |
| AI → Cognitive Debt | ${aiCogPct}% |
| AI Total Debt | ${((data.ai_total_debt ?? 0) * 100).toFixed(1)}% |
| High Risk Files | ${s.highRiskFiles} |
| Total Issues | ${s.totalIssues} |

## 🧠 Model Attribution
| Attribute | Value |
|-----------|-------|
| Dominant Model | ${data.model_attribution?.model_id ?? 'N/A'} |
| Model Confidence | ${((data.model_attribution?.confidence ?? 0) * 100).toFixed(0)}% |
| AI Technical Debt (formula) | ${((data.ai_technical_debt ?? 0) * 100).toFixed(1)}% |
| AI Cognitive Debt (formula) | ${((data.ai_cognitive_debt ?? 0) * 100).toFixed(1)}% |

> Model attribution is probabilistic and based on structural fingerprinting.

### Formulas
- **AI_signal** = AI_likelihood × ModelConfidence
- **AI_TDS** = AI_signal × (0.35×CC + 0.25×ND + 0.20×Dup + 0.20×Churn) + AI_signal × DPS
- **AI_CDS** = AI_signal × (0.30×CLI + 0.25×IAS + 0.20×AGS + 0.15×CSC + 0.10×Entropy) + AI_signal × ModelRisk
- **AI_Total_Debt** = AI_TD_Final + AI_CD_Final

## Overview
| Metric | Value |
|--------|-------|
| Total Files Analyzed | ${data.totalFiles} |
| Language | ${data.language || 'N/A'} |
| Stars | ${data.stars || 0} |
| Avg Technical Debt | ${(s.avgTechnicalDebt * 100).toFixed(1)}% |
| Avg Cognitive Debt | ${(s.avgCognitiveDebt * 100).toFixed(1)}% |

## 🤖 AI Code Analysis
- **SUS** (Structural Uniformity Score): ${avgMetrics.sus?.toFixed(2) || 'N/A'}
- **TDD** (Token Distribution Divergence): ${avgMetrics.tdd?.toFixed(2) || 'N/A'}
- **PRI** (Pattern Repetition Index): ${avgMetrics.pri?.toFixed(2) || 'N/A'}
- **CRS** (Comment Redundancy Score): ${avgMetrics.crs?.toFixed(2) || 'N/A'}
- **SCS** (Style Consistency Score): ${avgMetrics.scs?.toFixed(2) || 'N/A'}

## 🔴 Top AI-Problematic Files
${aiFilesSection}

## 🔥 Top Risk Files (Combined Debt)
${riskFilesSection}

## 🔧 Technical Debt Summary
- **CP** (Change Proneness): ${avgMetrics.cp?.toFixed(2) || 'N/A'}
- **TC** (Temporal Complexity): ${avgMetrics.tc?.toFixed(2) || 'N/A'}
- **DDP** (Defect Density Proxy): ${avgMetrics.ddp?.toFixed(2) || 'N/A'}
- **MDS** (Modularity Degradation): ${avgMetrics.mds?.toFixed(2) || 'N/A'}

## 🧠 Cognitive Debt Summary
- **CLI** (Cognitive Load Index): ${avgMetrics.cli?.toFixed(2) || 'N/A'}
- **IAS** (Identifier Ambiguity): ${avgMetrics.ias?.toFixed(2) || 'N/A'}
- **AGS** (Abstraction Gap): ${avgMetrics.ags?.toFixed(2) || 'N/A'}
- **RI** (Readability Index): ${avgMetrics.ri?.toFixed(2) || 'N/A'}
- **CSC** (Context Switching Cost): ${avgMetrics.csc?.toFixed(2) || 'N/A'}

## 💡 Recommendations
${recsSection}

## ⚠️ Limitations
- Model attribution is probabilistic and based on likelihood comparison
- Accuracy decreases if code has been heavily edited post-generation
- Fine-tuned or custom models may reduce detection reliability

---
*Generated by AI Debt Tracker — AI-induced debt detection with model attribution*
`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportDownload({ data }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadMD = () => {
    setDownloading("md");
    const md = generateMarkdownReport(data);
    downloadFile(md, `${data.repoName.replace("/", "-")}-report.md`, "text/markdown");
    setTimeout(() => setDownloading(null), 1000);
  };

  const handleDownloadJSON = () => {
    setDownloading("json");
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${data.repoName.replace("/", "-")}-analysis.json`, "application/json");
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownloadMD}
        disabled={downloading === "md"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      >
        <FileText className="h-3 w-3" />
        {downloading === "md" ? "Downloading..." : "Download .md"}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownloadJSON}
        disabled={downloading === "json"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
      >
        <FileCode className="h-3 w-3" />
        {downloading === "json" ? "Downloading..." : "Download JSON"}
      </motion.button>
    </div>
  );
}
