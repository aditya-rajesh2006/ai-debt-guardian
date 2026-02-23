import { motion } from "framer-motion";
import type { FileAnalysis } from "@/lib/mockAnalysis";

interface Props {
  file: FileAnalysis;
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(value * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

export default function DebtBreakdown({ file }: Props) {
  // Derive breakdown from existing metrics
  const complexity = Math.min(file.cyclomaticComplexity / 20, 1);
  const duplication = file.issues.includes("duplicate code blocks") || file.issues.includes("duplicate code")
    ? 0.7 + Math.random() * 0.3
    : file.metrics.dps * 0.5;
  const size = Math.min(file.linesOfCode / 400, 1);

  const readability = file.metrics.rdi;
  const naming = file.metrics.es;
  const structure = file.metrics.ccd;

  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-3">
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
        <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">Technical Debt</p>
        <div className="space-y-2">
          <MiniBar label="Complexity" value={complexity} color="hsl(36, 95%, 58%)" />
          <MiniBar label="Duplication" value={duplication} color="hsl(36, 80%, 50%)" />
          <MiniBar label="File Size" value={size} color="hsl(36, 70%, 45%)" />
        </div>
      </div>
      <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-3">
        <p className="text-[10px] font-semibold text-neon-purple uppercase tracking-wider mb-2">Cognitive Debt</p>
        <div className="space-y-2">
          <MiniBar label="Readability" value={readability} color="hsl(270, 72%, 62%)" />
          <MiniBar label="Naming Quality" value={naming} color="hsl(270, 60%, 55%)" />
          <MiniBar label="Structure" value={structure} color="hsl(270, 50%, 50%)" />
        </div>
      </div>
    </div>
  );
}
