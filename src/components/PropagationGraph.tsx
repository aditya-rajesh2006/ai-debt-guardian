import { useMemo, useCallback } from "react";
import type { AnalysisResult } from "@/lib/mockAnalysis";

interface Props {
  data: AnalysisResult;
}

export default function PropagationGraph({ data }: Props) {
  const nodes = useMemo(() => {
    return data.files.map((f, i) => {
      const angle = (2 * Math.PI * i) / data.files.length;
      const radius = 200;
      return {
        id: f.file,
        x: 300 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle),
        risk: f.aiLikelihood * 0.5 + f.technicalDebt * 0.3 + f.cognitiveDebt * 0.2,
        label: f.file.split('/').pop() || f.file,
      };
    });
  }, [data.files]);

  const getNode = useCallback((id: string) => nodes.find(n => n.id === id), [nodes]);

  const riskColor = (risk: number) => {
    if (risk > 0.7) return "hsl(0, 72%, 55%)";
    if (risk > 0.4) return "hsl(36, 95%, 58%)";
    return "hsl(174, 72%, 52%)";
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Propagation Graph</h3>
      <svg viewBox="0 0 600 500" className="w-full max-w-[600px] mx-auto">
        {/* Edges */}
        {data.propagation.map((edge, i) => {
          const s = getNode(edge.source);
          const t = getNode(edge.target);
          if (!s || !t) return null;
          return (
            <line
              key={i}
              x1={s.x} y1={s.y}
              x2={t.x} y2={t.y}
              stroke="hsl(174, 72%, 52%)"
              strokeOpacity={0.15 + edge.weight * 0.3}
              strokeWidth={0.5 + edge.weight * 1.5}
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x} cy={node.y}
              r={8 + node.risk * 12}
              fill={riskColor(node.risk)}
              fillOpacity={0.2}
              stroke={riskColor(node.risk)}
              strokeWidth={1.5}
            />
            <circle
              cx={node.x} cy={node.y}
              r={3}
              fill={riskColor(node.risk)}
            />
            <text
              x={node.x}
              y={node.y + 22 + node.risk * 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px] font-mono"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Low Risk</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> High Risk</span>
      </div>
    </div>
  );
}
