import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Brain, Bug, FileCode, GitFork, TrendingUp, Zap, AlertTriangle,
  RefreshCw, Star, Code, BarChart3, Network, Table2, Flame
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
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
import { useSearchParams } from "react-router-dom";

type Tab = "overview" | "files" | "graph";

// Cache for analysis results
const analysisCache = new Map<string, AnalysisResult>();

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [lastUrl, setLastUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("Initializing...");
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [searchParams] = useSearchParams();

  // Auto-analyze if ?repo= in URL
  useEffect(() => {
    const repo = searchParams.get("repo");
    if (repo) handleAnalyze(repo);
  }, []);

  const startProgress = () => {
    setProgress(0);
    const steps = [
      { p: 10, msg: "Connecting to GitHub API..." },
      { p: 25, msg: "Fetching repository structure..." },
      { p: 45, msg: "Downloading source files..." },
      { p: 65, msg: "Running AI pattern detection..." },
      { p: 78, msg: "Calculating technical debt..." },
      { p: 88, msg: "Analyzing cognitive load..." },
      { p: 95, msg: "Building propagation graph..." },
    ];
    let i = 0;
    progressRef.current = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].p);
        setProgressMsg(steps[i].msg);
        i++;
      }
    }, 900);
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressMsg("Analysis complete!");
  };

  const handleAnalyze = async (url: string) => {
    const trimmed = url.trim();
    if (analysisCache.has(trimmed)) {
      setData(analysisCache.get(trimmed)!);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setLastUrl(trimmed);
    setData(null);
    startProgress();
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-repo", {
        body: { repoUrl: trimmed },
      });
      if (fnError) throw new Error(fnError.message);
      if (result?.error) throw new Error(result.error);
      const analysis = result as AnalysisResult;
      analysisCache.set(trimmed, analysis);
      setData(analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  // Chart data
  const isDark = document.documentElement.classList.contains("dark");
  const tooltipBg = isDark ? "hsl(220, 18%, 7%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 14%, 16%)" : "hsl(210, 14%, 88%)";
  const tickColor = isDark ? "hsl(215, 12%, 50%)" : "hsl(215, 12%, 45%)";

  const chartData = data?.files.slice(0, 10).map(f => ({
    name: f.file.split('/').pop()?.slice(0, 12) ?? f.file,
    ai: Math.round(f.aiLikelihood * 100),
    tech: Math.round(f.technicalDebt * 100),
    cog: Math.round(f.cognitiveDebt * 100),
  }));

  const pieData = data ? [
    { name: "Technical", value: Math.round(data.summary.avgTechnicalDebt * 100), fill: "hsl(36, 95%, 58%)" },
    { name: "Cognitive", value: Math.round(data.summary.avgCognitiveDebt * 100), fill: "hsl(270, 72%, 62%)" },
    { name: "Clean", value: Math.max(0, 100 - Math.round((data.summary.avgTechnicalDebt + data.summary.avgCognitiveDebt) * 50)), fill: "hsl(174, 72%, 52%)" },
  ] : [];

  const radarData = data ? (() => {
    const files = data.files;
    const avg = (key: keyof typeof files[0]['metrics']) =>
      Math.round(files.reduce((s, f) => s + f.metrics[key], 0) / files.length * 100);
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

  const heatmapData = data?.files
    .sort((a, b) => (b.technicalDebt + b.cognitiveDebt) - (a.technicalDebt + a.cognitiveDebt))
    .slice(0, 15)
    .map(f => ({ name: f.file.split('/').pop() || f.file, debt: Math.round((f.technicalDebt + f.cognitiveDebt) / 2 * 100) }));

  // Top risk files
  const topRiskFiles = data?.files
    .sort((a, b) => (b.aiLikelihood + b.technicalDebt + b.cognitiveDebt) - (a.aiLikelihood + a.technicalDebt + a.cognitiveDebt))
    .slice(0, 5);

  const refactorScore = data
    ? Math.round(((data.summary.avgTechnicalDebt + data.summary.avgCognitiveDebt) / 2) * 100)
    : 0;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "files", label: "Files", icon: Table2 },
    { id: "graph", label: "Graph", icon: Network },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10 container pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground">Analysis Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Analyze any public GitHub repository for AI-induced debt</p>
        </motion.div>

        <RepoInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Progress bar */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 mx-auto max-w-xl">
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
                {/* Animated scan bar */}
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-4">
                  <motion.div
                    className="absolute h-full rounded-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <div className="scan-bar absolute h-full w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono">{progressMsg}</span>
                  </span>
                  <span className="font-mono text-primary">{progress}%</span>
                </div>
              </div>
              {/* Skeleton */}
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 rounded-xl" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Skeleton className="h-64 rounded-xl" />
                  <Skeleton className="h-64 rounded-xl" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 mx-auto max-w-lg text-center">
              <div className="inline-flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <button onClick={() => handleAnalyze(lastUrl)} className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mt-10 space-y-8">

            {/* Repo info + tabs */}
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
              {/* Tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <tab.icon className="h-3 w-3 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Cards (always visible) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="AI Likelihood" value={data.summary.avgAiLikelihood * 100} suffix="%" icon={Zap} color="cyan" delay={0} description="Avg across files" />
              <MetricCard title="Technical Debt" value={data.summary.avgTechnicalDebt * 100} suffix="%" icon={Bug} color="amber" delay={0.1} description="AI-induced portion" />
              <MetricCard title="Cognitive Debt" value={data.summary.avgCognitiveDebt * 100} suffix="%" icon={Brain} color="purple" delay={0.2} description="Readability impact" />
              <MetricCard title="High Risk Files" value={data.summary.highRiskFiles} icon={AlertTriangle} color="red" delay={0.3} description={`of ${data.totalFiles} total`} />
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="space-y-6">

                  {/* Refactor Priority Score + Top Risk */}
                  <div className="grid gap-4 lg:grid-cols-3">
                    {/* Refactor Score */}
                    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="h-4 w-4 text-destructive" />
                        <h3 className="text-sm font-semibold text-foreground">Refactor Priority Score</h3>
                      </div>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-black font-mono text-foreground">{refactorScore}</span>
                        <span className="text-sm text-muted-foreground mb-1">/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: refactorScore > 60 ? "hsl(var(--destructive))" : refactorScore > 30 ? "hsl(var(--neon-amber))" : "hsl(var(--primary))" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${refactorScore}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {refactorScore > 60 ? "⚠️ High priority – refactor soon" : refactorScore > 30 ? "⚡ Moderate – schedule cleanup" : "✅ Low debt – code looks healthy"}
                      </p>
                    </div>

                    {/* Top Risk Files */}
                    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h3 className="text-sm font-semibold text-foreground">Top Risk Files</h3>
                      </div>
                      <div className="space-y-2.5">
                        {topRiskFiles?.map((f, i) => {
                          const risk = Math.round((f.aiLikelihood + f.technicalDebt + f.cognitiveDebt) / 3 * 100);
                          return (
                            <div key={f.file} className="flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                              <span className="flex-1 text-xs font-mono text-foreground truncate">{f.file.split('/').slice(-2).join('/')}</span>
                              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-destructive"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${risk}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                />
                              </div>
                              <span className="text-xs font-mono text-destructive w-8 text-right">{risk}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Bar Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 lg:col-span-2"
                    >
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Distribution by File</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} barGap={2}>
                          <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 9 }} />
                          <YAxis tick={{ fill: tickColor, fontSize: 9 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
                            cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                          />
                          <Bar dataKey="ai" name="AI Likelihood %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(174, 72%, 52%)" fillOpacity={0.75} />)}
                          </Bar>
                          <Bar dataKey="tech" name="Tech Debt %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(36, 95%, 58%)" fillOpacity={0.75} />)}
                          </Bar>
                          <Bar dataKey="cog" name="Cognitive %" radius={[4, 4, 0, 0]}>
                            {chartData?.map((_, i) => <Cell key={i} fill="hsl(270, 72%, 62%)" fillOpacity={0.75} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Pie Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4"
                    >
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Composition</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                        {pieData.map(d => (
                          <span key={d.name} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                            {d.name}: <span className="text-foreground font-mono">{d.value}%</span>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Radar + Heatmap */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4"
                    >
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Metrics Radar</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke={`hsl(var(--border))`} />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: tickColor, fontSize: 10 }} />
                          <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 8 }} domain={[0, 100]} />
                          <Radar name="Score" dataKey="value" stroke="hsl(174, 72%, 52%)" fill="hsl(174, 72%, 52%)" fillOpacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4"
                    >
                      <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Heatmap</h3>
                      <div className="grid grid-cols-5 gap-1.5">
                        {heatmapData?.map((f, i) => {
                          const intensity = f.debt / 100;
                          const hue = 174 - intensity * 174;
                          return (
                            <motion.div
                              key={f.name}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04 }}
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              className="group relative flex items-center justify-center rounded-lg p-3 cursor-default"
                              style={{ backgroundColor: `hsl(${hue}, 72%, 52%, ${0.15 + intensity * 0.4})` }}
                            >
                              <span className="text-[8px] font-mono text-foreground truncate">{f.name.slice(0, 8)}</span>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-popover px-2 py-1 text-[10px] text-popover-foreground border border-border whitespace-nowrap z-20 shadow-lg">
                                {f.name}: {f.debt}%
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>

                  {/* Insights */}
                  <InsightsPanel data={data} />
                </motion.div>
              )}

              {activeTab === "files" && (
                <motion.div key="files" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  <FileTable files={data.files} />
                </motion.div>
              )}

              {activeTab === "graph" && (
                <motion.div key="graph" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                  <PropagationGraph data={data} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
