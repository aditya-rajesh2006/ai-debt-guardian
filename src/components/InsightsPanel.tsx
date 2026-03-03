import { motion } from "framer-motion";
import { AlertTriangle, Brain, GitFork, Wrench, Bot, Flame, Cpu } from "lucide-react";
import MetricTooltip from "./MetricTooltip";
import type { AnalysisResult } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

export default function InsightsPanel({ data }: Props) {
  const highDebt = [...data.files].sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt)).slice(0, 5);
  const highPropagation = [...data.files].sort((a, b) => b.propagationScore - a.propagationScore).slice(0, 3);
  const highAI = [...data.files].sort((a, b) => b.aiDebtContribution - a.aiDebtContribution).slice(0, 5);

  // AI debt attribution
  const totalTechDebt = data.files.reduce((s, f) => s + f.technicalDebt, 0);
  const totalCogDebt = data.files.reduce((s, f) => s + f.cognitiveDebt, 0);
  const aiTechDebt = data.files.reduce((s, f) => s + f.technicalDebt * f.aiLikelihood, 0);
  const aiCogDebt = data.files.reduce((s, f) => s + f.cognitiveDebt * f.aiLikelihood, 0);
  const aiTechPct = totalTechDebt > 0 ? Math.round(aiTechDebt / totalTechDebt * 100) : 0;
  const aiCogPct = totalCogDebt > 0 ? Math.round(aiCogDebt / totalCogDebt * 100) : 0;

  // Model attribution summary
  const modelCounts = new Map<string, number>();
  for (const f of data.files) {
    if (f.modelAttribution?.model_id) {
      modelCounts.set(f.modelAttribution.model_id, (modelCounts.get(f.modelAttribution.model_id) || 0) + 1);
    }
  }
  const topModels = [...modelCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const sections = [
    {
      icon: Bot,
      title: "AI-Induced Debt Leaders",
      items: highAI.map(f => ({
        label: f.file.split('/').pop()!,
        value: `${f.aiDebtContribution}% AI debt`,
      })),
      color: "text-neon-purple",
    },
    {
      icon: AlertTriangle,
      title: "Highest Combined Debt",
      items: highDebt.map(f => ({ label: f.file.split('/').pop()!, value: `${((f.technicalDebt + f.cognitiveDebt) / 2 * 100).toFixed(0)}%` })),
      color: "text-destructive",
    },
    {
      icon: GitFork,
      title: "Most Propagated Sources",
      items: highPropagation.map(f => ({ label: f.file.split('/').pop()!, value: `${(f.propagationScore * 100).toFixed(0)}%` })),
      color: "text-accent",
    },
    {
      icon: Wrench,
      title: "Refactor First",
      items: data.summary.topRefactorTargets.map(f => ({ label: f.split('/').pop()!, value: "Priority" })),
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      {/* AI Debt Attribution Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neon-purple/30 bg-neon-purple/5 backdrop-blur-sm p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-neon-purple" />
          <h3 className="text-sm font-bold text-foreground">AI-Induced Debt Attribution</h3>
        </div>
        <p className="text-sm text-foreground mb-4">
          AI-generated code contributes <strong className="text-neon-purple text-lg font-mono">{aiTechPct}%</strong> of total technical debt
          and <strong className="text-neon-purple text-lg font-mono">{aiCogPct}%</strong> of total cognitive debt.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">AI → Technical Debt</span>
              <span className="font-mono text-neon-purple">{aiTechPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--neon-purple))" }}
                initial={{ width: 0 }}
                animate={{ width: `${aiTechPct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">AI → Cognitive Debt</span>
              <span className="font-mono text-neon-purple">{aiCogPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "hsl(var(--neon-purple))" }}
                initial={{ width: 0 }}
                animate={{ width: `${aiCogPct}%` }}
                transition={{ duration: 1, delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Model Attribution Panel */}
      {data.model_attribution && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-5 w-5 text-primary" />
            <MetricTooltip metric="Model Attribution">
              <h3 className="text-sm font-bold text-foreground">Model Attribution</h3>
            </MetricTooltip>
          </div>
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dominant Model</p>
              <p className="text-lg font-black font-mono text-primary">{data.model_attribution.model_id}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
              <p className="text-lg font-black font-mono text-primary">{(data.model_attribution.confidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Total Debt</p>
              <p className="text-lg font-black font-mono text-neon-purple">{(data.ai_total_debt * 100).toFixed(0)}%</p>
            </div>
          </div>
          {topModels.length > 1 && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {topModels.map(([model, count]) => (
                <span key={model} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-primary font-mono">
                  {model}: {count} files
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2 italic">⚠️ Model attribution is probabilistic and based on structural fingerprinting.</p>
        </motion.div>
      )}

      {/* AI vs Human Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">AI vs Human Debt Comparison</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Technical Debt split */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Technical Debt Source</p>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              <motion.div
                className="rounded-l-full"
                style={{ background: "hsl(var(--neon-purple))", width: `${aiTechPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${aiTechPct}%` }}
                transition={{ duration: 0.8 }}
              />
              <motion.div
                className="rounded-r-full"
                style={{ background: "hsl(var(--primary))", width: `${100 - aiTechPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${100 - aiTechPct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neon-purple" /> AI: {aiTechPct}%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Human: {100 - aiTechPct}%</span>
            </div>
          </div>
          {/* Cognitive Debt split */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cognitive Debt Source</p>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              <motion.div
                className="rounded-l-full"
                style={{ background: "hsl(var(--neon-purple))", width: `${aiCogPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${aiCogPct}%` }}
                transition={{ duration: 0.8 }}
              />
              <motion.div
                className="rounded-r-full"
                style={{ background: "hsl(var(--primary))", width: `${100 - aiCogPct}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${100 - aiCogPct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-neon-purple" /> AI: {aiCogPct}%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Human: {100 - aiCogPct}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`h-4 w-4 ${section.color}`} />
              <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground truncate mr-2">{item.label}</span>
                  <span className={`font-semibold ${section.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
