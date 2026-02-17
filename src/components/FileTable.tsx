import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, FileCode, AlertTriangle } from "lucide-react";
import ScoreBar from "./ScoreBar";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  files: FileAnalysis[];
}

export default function FileTable({ files }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"ai" | "tech" | "cog">("ai");

  const sorted = [...files]
    .filter(f => f.file.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "ai") return b.aiLikelihood - a.aiLikelihood;
      if (sortBy === "tech") return b.technicalDebt - a.technicalDebt;
      return b.cognitiveDebt - a.cognitiveDebt;
    });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                  className="overflow-hidden border-t border-border bg-secondary/20"
                >
                  <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <ScoreBar label="AI Likelihood" value={file.aiLikelihood} />
                      <ScoreBar label="Technical Debt" value={file.technicalDebt} />
                      <ScoreBar label="Cognitive Debt" value={file.cognitiveDebt} />
                      <ScoreBar label="Propagation" value={file.propagationScore} />
                    </div>
                    <div className="space-y-3">
                      <ScoreBar label="CCD" value={file.metrics.ccd} />
                      <ScoreBar label="Explainability" value={file.metrics.es} />
                      <ScoreBar label="AI Entropy" value={file.metrics.aes} />
                      <ScoreBar label="Readability" value={file.metrics.rdi} />
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Issues detected:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {file.issues.map((issue) => (
                          <span key={issue} className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            {issue}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                        <span>LOC: <strong className="text-foreground">{file.linesOfCode}</strong></span>
                        <span>Funcs: <strong className="text-foreground">{file.functions}</strong></span>
                        <span>Complexity: <strong className="text-foreground">{file.cyclomaticComplexity}</strong></span>
                        <span>Depth: <strong className="text-foreground">{file.nestingDepth}</strong></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
