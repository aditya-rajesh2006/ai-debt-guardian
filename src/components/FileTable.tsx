import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, FileCode, AlertTriangle, Flame, Brain } from "lucide-react";
import ScoreBar from "./ScoreBar";
import DebtBreakdown from "./DebtBreakdown";
import MetricTooltip from "./MetricTooltip";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  files: FileAnalysis[];
}

export default function FileTable({ files }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"ai" | "tech" | "cog">("ai");
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  const sorted = [...files]
    .filter(f => f.file.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "ai") return b.aiLikelihood - a.aiLikelihood;
      if (sortBy === "tech") return b.technicalDebt - a.technicalDebt;
      return b.cognitiveDebt - a.cognitiveDebt;
    });

  const confusionHotspots = files
    .filter(f => f.cognitiveDebt > 0.6 && f.cyclomaticComplexity > 8)
    .sort((a, b) => b.cognitiveDebt - a.cognitiveDebt)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {confusionHotspots.length > 0 && (
        <div className="rounded-xl border border-neon-purple/20 bg-neon-purple/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-neon-purple" />
            <span className="text-xs font-semibold text-foreground">Confusion Hotspots</span>
            <span className="text-[10px] text-muted-foreground ml-auto">High cognitive debt + high complexity</span>
          </div>
          <div className="space-y-2">
            {confusionHotspots.map(f => (
              <div key={f.file} className="flex items-center gap-3 text-xs">
                <Flame className="h-3 w-3 text-neon-purple shrink-0" />
                <span className="font-mono text-foreground truncate flex-1">{f.file.split("/").pop()}</span>
                <span className="text-muted-foreground">CLI: <strong className="text-neon-purple">{((f.metrics.cli ?? f.cognitiveDebt) * 100).toFixed(0)}%</strong></span>
                <span className="text-muted-foreground">Complexity: <strong className="text-foreground">{f.cyclomaticComplexity}</strong></span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-1">⚠️ These files are frequently hard to understand — prioritize refactoring</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-foreground">File Analysis</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter files..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "ai" | "tech" | "cog")}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="ai">AI Likelihood</option>
              <option value="tech">Tech Debt</option>
              <option value="cog">Cognitive Debt</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {sorted.map((file) => (
            <div key={file.file}>
              <button
                onClick={() => setExpanded(expanded === file.file ? null : file.file)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
              >
                {expanded === file.file ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="flex-1 truncate text-xs font-mono text-foreground">{file.file}</span>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="font-mono text-primary">{(file.aiLikelihood * 100).toFixed(0)}%</span>
                  {file.aiLikelihood > 0.7 && <AlertTriangle className="h-3 w-3 text-accent" />}
                </div>
              </button>

              <AnimatePresence>
                {expanded === file.file && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border bg-secondary/10"
                  >
                    <div className="p-4 space-y-4">
                      {/* AI Detection Summary */}
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">AI Generated Code</span>
                          <span className="text-lg font-black font-mono text-primary">{(file.aiLikelihood * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                          {file.metrics.sus > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">repetitive patterns</span>}
                          {file.metrics.crs > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">redundant comments</span>}
                          {file.metrics.scs > 0.5 && <span className="rounded bg-primary/10 px-1.5 py-0.5">uniform style</span>}
                          {file.metrics.ias > 0.3 && <span className="rounded bg-primary/10 px-1.5 py-0.5">generic naming</span>}
                          {file.metrics.pri > 0.2 && <span className="rounded bg-primary/10 px-1.5 py-0.5">high repetition</span>}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                          <MetricTooltip metric="AI Likelihood"><ScoreBar label="AI Likelihood" value={file.aiLikelihood} /></MetricTooltip>
                          <MetricTooltip metric="Technical Debt"><ScoreBar label="Technical Debt" value={file.technicalDebt} /></MetricTooltip>
                          <MetricTooltip metric="Cognitive Debt"><ScoreBar label="Cognitive Debt" value={file.cognitiveDebt} /></MetricTooltip>
                          <MetricTooltip metric="Propagation"><ScoreBar label="Propagation" value={file.propagationScore} /></MetricTooltip>
                        </div>
                        <div className="space-y-3">
                          <MetricTooltip metric="CLI"><ScoreBar label="Cognitive Load" value={file.metrics.cli ?? 0} /></MetricTooltip>
                          <MetricTooltip metric="IAS"><ScoreBar label="Identifier Ambiguity" value={file.metrics.ias ?? 0} /></MetricTooltip>
                          <MetricTooltip metric="SUS"><ScoreBar label="Structural Uniformity" value={file.metrics.sus ?? 0} /></MetricTooltip>
                          <MetricTooltip metric="DDP"><ScoreBar label="Defect Density" value={file.metrics.ddp ?? 0} /></MetricTooltip>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Issues detected:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {file.issues.map((issue) => (
                            <span key={issue} className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                        <span>LOC: <strong className="text-foreground">{file.linesOfCode}</strong></span>
                        <span>Funcs: <strong className="text-foreground">{file.functions}</strong></span>
                        <span>Complexity: <strong className="text-foreground">{file.cyclomaticComplexity}</strong></span>
                        <span>Depth: <strong className="text-foreground">{file.nestingDepth}</strong></span>
                      </div>

                      <button
                        onClick={() => setShowBreakdown(showBreakdown === file.file ? null : file.file)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        {showBreakdown === file.file ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {showBreakdown === file.file ? "Hide" : "Show"} Full Debt Breakdown
                      </button>

                      <AnimatePresence>
                        {showBreakdown === file.file && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <DebtBreakdown file={file} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
