import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Brain, Bug, FileCode, GitFork, TrendingUp, Zap, AlertTriangle, RefreshCw, Star, Code } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RepoInput from "@/components/RepoInput";
import MetricCard from "@/components/MetricCard";
import FileTable from "@/components/FileTable";
import PropagationGraph from "@/components/PropagationGraph";
import InsightsPanel from "@/components/InsightsPanel";
import type { AnalysisResult } from "@/lib/mockAnalysis";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"ai" | "all">("ai");
  const [lastUrl, setLastUrl] = useState("");

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setError(null);
    setLastUrl(url);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-repo", {
        body: { repoUrl: url },
      });
      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);
      setData(result as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = data?.files.slice(0, 10).map(f => ({
    name: f.file.split('/').pop(),
    ai: Math.round(f.aiLikelihood * 100),
    tech: Math.round(f.technicalDebt * 100),
    cog: Math.round(f.cognitiveDebt * 100),
  }));

  const pieData = data ? [
    { name: "Technical Debt", value: Math.round(data.summary.avgTechnicalDebt * 100), fill: "hsl(36, 95%, 58%)" },
    { name: "Cognitive Debt", value: Math.round(data.summary.avgCognitiveDebt * 100), fill: "hsl(270, 72%, 62%)" },
    { name: "Clean", value: Math.max(0, 100 - Math.round((data.summary.avgTechnicalDebt + data.summary.avgCognitiveDebt) * 50)), fill: "hsl(174, 72%, 52%)" },
  ] : [];

  const radarData = data ? (() => {
    const files = data.files;
    const avg = (key: keyof typeof files[0]['metrics']) => Math.round(files.reduce((s, f) => s + f.metrics[key], 0) / files.length * 100);
    return [
      { metric: "DPS", value: avg("dps") },
      { metric: "DLI", value: avg("dli") },
      { metric: "DRF", value: avg("drf") },
      { metric: "CCD", value: avg("ccd") },
      { metric: "ES", value: avg("es") },
      { metric: "AES", value: avg("aes") },
      { metric: "RDI", value: avg("rdi") },
    ];
  })() : [];

  // Heatmap data
  const heatmapData = data?.files
    .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
    .slice(0, 15)
    .map(f => ({
      name: f.file.split('/').pop() || f.file,
      debt: Math.round((f.technicalDebt + f.cognitiveDebt) / 2 * 100),
    }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Metrics Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Analyze any GitHub repository for AI-induced debt</p>
        </motion.div>

        <RepoInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 mx-auto max-w-lg text-center"
            >
              <div className="inline-flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <button
                onClick={() => handleAnalyze(lastUrl)}
                className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-primary font-mono">Analyzing repository via backend...</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </div>
        )}

        {data && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 space-y-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground font-mono">{data.repoName}</h2>
                {(data as any).stars > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 text-accent" /> {(data as any).stars}
                  </span>
                )}
                {(data as any).language && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Code className="h-3 w-3" /> {(data as any).language}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
                <button
                  onClick={() => setViewMode("ai")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${viewMode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  AI-Induced
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${viewMode === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  All Debt
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="AI Likelihood" value={data.summary.avgAiLikelihood * 100} suffix="%" icon={Zap} color="cyan" delay={0} description="Avg across files" />
              <MetricCard title="Technical Debt" value={data.summary.avgTechnicalDebt * 100} suffix="%" icon={Bug} color="amber" delay={0.1} description="AI-induced portion" />
              <MetricCard title="Cognitive Debt" value={data.summary.avgCognitiveDebt * 100} suffix="%" icon={Brain} color="purple" delay={0.2} description="Readability impact" />
              <MetricCard title="High Risk Files" value={data.summary.highRiskFiles} icon={AlertTriangle} color="red" delay={0.3} description={`of ${data.totalFiles} total`} />
            </div>

            {/* Charts Row: Bar + Pie + Radar */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Bar Chart */}
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Distribution by File</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 7%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="ai" name="AI Likelihood" radius={[4, 4, 0, 0]}>
                      {chartData?.map((_, i) => <Cell key={i} fill="hsl(174, 72%, 52%)" fillOpacity={0.7} />)}
                    </Bar>
                    <Bar dataKey="tech" name="Tech Debt" radius={[4, 4, 0, 0]}>
                      {chartData?.map((_, i) => <Cell key={i} fill="hsl(36, 95%, 58%)" fillOpacity={0.7} />)}
                    </Bar>
                    <Bar dataKey="cog" name="Cognitive" radius={[4, 4, 0, 0]}>
                      {chartData?.map((_, i) => <Cell key={i} fill="hsl(270, 72%, 62%)" fillOpacity={0.7} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 7%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                  {pieData.map(d => (
                    <span key={d.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} /> {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Radar + Heatmap */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar */}
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Metrics Radar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(220, 14%, 16%)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 8 }} domain={[0, 100]} />
                    <Radar name="Score" dataKey="value" stroke="hsl(174, 72%, 52%)" fill="hsl(174, 72%, 52%)" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Heatmap */}
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Heatmap</h3>
                <div className="grid grid-cols-5 gap-1.5">
                  {heatmapData?.map((f, i) => {
                    const intensity = f.debt / 100;
                    const hue = 174 - intensity * 174;
                    return (
                      <motion.div
                        key={f.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="group relative flex items-center justify-center rounded-lg p-3 cursor-default"
                        style={{ backgroundColor: `hsl(${hue}, 72%, 52%, ${0.15 + intensity * 0.4})` }}
                        title={`${f.name}: ${f.debt}%`}
                      >
                        <span className="text-[8px] font-mono text-foreground truncate">{f.name.slice(0, 8)}</span>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground border border-border whitespace-nowrap z-10">
                          {f.name}: {f.debt}%
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Propagation + Insights */}
            <div className="grid gap-8 lg:grid-cols-2">
              <PropagationGraph data={data} />
              <InsightsPanel data={data} />
            </div>

            {/* File Table */}
            <FileTable files={data.files} />
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
