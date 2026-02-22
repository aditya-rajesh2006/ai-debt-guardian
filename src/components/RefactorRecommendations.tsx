import { motion } from "framer-motion";
import { Wrench, ChevronRight, AlertTriangle, CheckCircle, Code } from "lucide-react";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  files: FileAnalysis[];
}

interface Recommendation {
  file: string;
  priority: "critical" | "high" | "medium";
  steps: string[];
  impact: string;
  issues: string[];
}

function generateRecommendations(files: FileAnalysis[]): Recommendation[] {
  const sorted = [...files].sort(
    (a, b) => (b.technicalDebt + b.cognitiveDebt + b.aiLikelihood) - (a.technicalDebt + a.cognitiveDebt + a.aiLikelihood)
  );

  return sorted.slice(0, 6).map(f => {
    const steps: string[] = [];
    const totalDebt = f.technicalDebt + f.cognitiveDebt;

    // Generate specific steps based on detected issues
    if (f.cyclomaticComplexity > 15) {
      steps.push(`Break down complex logic (complexity: ${f.cyclomaticComplexity}) — extract conditional branches into named helper functions`);
    }
    if (f.nestingDepth > 3) {
      steps.push(`Reduce nesting depth from ${f.nestingDepth} to ≤3 — use early returns, guard clauses, and function extraction`);
    }
    if (f.linesOfCode > 300) {
      steps.push(`Split large file (${f.linesOfCode} LOC) — separate concerns into focused modules of <150 LOC each`);
    }
    if (f.issues.includes("duplicate code blocks")) {
      steps.push("Extract duplicate code blocks into shared utility functions with clear naming");
    }
    if (f.issues.includes("overly generic naming") || f.issues.includes("inconsistent naming conventions")) {
      steps.push("Rename variables: replace generic names (data, temp, result) with domain-specific descriptive names");
    }
    if (f.issues.includes("missing error handling")) {
      steps.push("Add try/catch blocks around async operations with specific error types and user-friendly messages");
    }
    if (f.issues.includes("excessive comments") || f.issues.includes("over-explained comments")) {
      steps.push("Remove obvious/redundant comments — let well-named functions and variables self-document");
    }
    if (f.issues.includes("magic numbers")) {
      steps.push("Extract magic numbers into named constants with clear documentation of their purpose");
    }
    if (f.issues.includes("unnecessary abstraction")) {
      steps.push("Remove unnecessary wrapper functions — inline single-use abstractions that add complexity without value");
    }
    if (f.issues.includes("similar function structures")) {
      steps.push("Consolidate similar functions using generics or parameterized factory patterns");
    }
    if (f.issues.includes("repeated logic across files")) {
      steps.push("Create shared module for repeated cross-file logic — establish single source of truth");
    }
    if (f.issues.includes("poor modularization") || f.issues.includes("missing modularization")) {
      steps.push("Apply Single Responsibility Principle — each function/module should do exactly one thing");
    }
    if (f.metrics.rdi > 0.6) {
      steps.push("Improve readability: add whitespace between logical sections, use consistent formatting");
    }
    if (f.metrics.ccd > 0.6) {
      steps.push("Reduce cognitive complexity: simplify control flow, extract complex conditions into named booleans");
    }

    // Always add at least 2 steps
    if (steps.length < 2) {
      steps.push("Add unit tests to cover critical paths before refactoring");
      steps.push("Review and update function signatures for clarity and type safety");
    }

    const priority = totalDebt > 1.2 ? "critical" : totalDebt > 0.7 ? "high" : "medium";
    const impactPct = Math.round((f.technicalDebt + f.cognitiveDebt) / files.reduce((s, x) => s + x.technicalDebt + x.cognitiveDebt, 0) * 100);

    return {
      file: f.file,
      priority,
      steps,
      impact: `Fixing this file reduces total system debt by ~${impactPct}%`,
      issues: f.issues,
    };
  });
}

const priorityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "CRITICAL" },
  high: { color: "text-accent", bg: "bg-accent/10", border: "border-accent/30", label: "HIGH" },
  medium: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "MEDIUM" },
};

export default function RefactorRecommendations({ files }: Props) {
  const recommendations = generateRecommendations(files);

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <Wrench className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Step-by-Step Refactor Plan</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{recommendations.length} files to fix</span>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority];
          return (
            <motion.div
              key={rec.file}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-lg border ${config.border} ${config.bg} p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold ${config.color} px-2 py-0.5 rounded border ${config.border}`}>
                  {config.label}
                </span>
                <Code className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-mono text-foreground truncate">{rec.file}</span>
              </div>

              <div className="space-y-2 ml-2">
                {rec.steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-neon-green" />
                <span className="text-[10px] text-neon-green font-medium">{rec.impact}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
