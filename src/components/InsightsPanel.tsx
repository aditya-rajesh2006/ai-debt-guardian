import { motion } from "framer-motion";
import { AlertTriangle, Brain, GitFork, Wrench } from "lucide-react";
import type { AnalysisResult } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

export default function InsightsPanel({ data }: Props) {
  const highDebt = [...data.files].sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt)).slice(0, 5);
  const highPropagation = [...data.files].sort((a, b) => b.propagationScore - a.propagationScore).slice(0, 3);
  const highCognitive = [...data.files].sort((a, b) => b.cognitiveDebt - a.cognitiveDebt).slice(0, 3);

  const sections = [
    {
      icon: AlertTriangle,
      title: "Highest AI-Induced Debt",
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
      icon: Brain,
      title: "High Cognitive Burden",
      items: highCognitive.map(f => ({ label: f.file.split('/').pop()!, value: `${(f.cognitiveDebt * 100).toFixed(0)}%` })),
      color: "text-neon-purple",
    },
    {
      icon: Wrench,
      title: "Refactor First",
      items: data.summary.topRefactorTargets.map(f => ({ label: f.split('/').pop()!, value: "Priority" })),
      color: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sections.map((section, i) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
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
  );
}
