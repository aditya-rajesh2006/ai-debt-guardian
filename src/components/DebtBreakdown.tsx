import { motion } from "framer-motion";
import type { FileAnalysis } from "@/lib/mockAnalysis";
import MetricTooltip from "./MetricTooltip";

interface Props {
  file: FileAnalysis;
}

function MiniBar({ label, value, color, tooltip }: { label: string; value: number; color: string; tooltip?: string }) {
  const pct = Math.min(value * 100, 100);
  const content = (
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

  if (tooltip) {
    return <MetricTooltip metric={tooltip} side="left">{content}</MetricTooltip>;
  }
  return content;
}

export default function DebtBreakdown({ file }: Props) {
  const complexity = Math.min(file.cyclomaticComplexity / 20, 1);
  const duplication = file.issues.includes("duplicate code blocks") || file.issues.includes("duplicate code")
    ? 0.7 + Math.random() * 0.3
    : file.metrics.dps * 0.5;
  const size = Math.min(file.linesOfCode / 400, 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-3">
      {/* Technical Debt */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
        <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">Technical Debt</p>
        <div className="space-y-2">
          <MiniBar label="Complexity" value={complexity} color="hsl(36, 95%, 58%)" />
          <MiniBar label="Duplication" value={duplication} color="hsl(36, 80%, 50%)" />
          <MiniBar label="File Size" value={size} color="hsl(36, 70%, 45%)" />
          <MiniBar label="DDP" value={file.metrics.ddp} color="hsl(36, 60%, 42%)" tooltip="DDP" />
          <MiniBar label="MDS" value={file.metrics.mds} color="hsl(36, 55%, 40%)" tooltip="MDS" />
          <MiniBar label="TC" value={file.metrics.tc} color="hsl(36, 50%, 38%)" tooltip="TC" />
        </div>
      </div>

      {/* Cognitive Debt */}
      <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-3">
        <p className="text-[10px] font-semibold text-neon-purple uppercase tracking-wider mb-2">Cognitive Debt</p>
        <div className="space-y-2">
          <MiniBar label="CLI" value={file.metrics.cli} color="hsl(270, 72%, 62%)" tooltip="CLI" />
          <MiniBar label="IAS" value={file.metrics.ias} color="hsl(270, 65%, 58%)" tooltip="IAS" />
          <MiniBar label="AGS" value={file.metrics.ags} color="hsl(270, 58%, 54%)" tooltip="AGS" />
          <MiniBar label="RI" value={file.metrics.ri} color="hsl(270, 52%, 50%)" tooltip="RI" />
          <MiniBar label="CSC" value={file.metrics.csc} color="hsl(270, 46%, 46%)" tooltip="CSC" />
          <MiniBar label="RDI" value={file.metrics.rdi} color="hsl(270, 40%, 42%)" tooltip="RDI" />
        </div>
      </div>

      {/* AI Detection */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">AI Detection</p>
        <div className="space-y-2">
          <MiniBar label="SUS" value={file.metrics.sus} color="hsl(174, 72%, 52%)" tooltip="SUS" />
          <MiniBar label="TDD" value={file.metrics.tdd} color="hsl(174, 65%, 48%)" tooltip="TDD" />
          <MiniBar label="PRI" value={file.metrics.pri} color="hsl(174, 58%, 44%)" tooltip="PRI" />
          <MiniBar label="CRS" value={file.metrics.crs} color="hsl(174, 52%, 40%)" tooltip="CRS" />
          <MiniBar label="SCS" value={file.metrics.scs} color="hsl(174, 46%, 36%)" tooltip="SCS" />
        </div>
      </div>
    </div>
  );
}
