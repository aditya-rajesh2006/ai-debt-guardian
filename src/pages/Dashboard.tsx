import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Brain, Bug, FileCode, GitFork, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RepoInput from "@/components/RepoInput";
import MetricCard from "@/components/MetricCard";
import FileTable from "@/components/FileTable";
import PropagationGraph from "@/components/PropagationGraph";
import InsightsPanel from "@/components/InsightsPanel";
import { generateMockAnalysis, type AnalysisResult } from "@/lib/mockAnalysis";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"ai" | "all">("ai");

  const handleAnalyze = (url: string) => {
    setLoading(true);
    const name = url.replace(/https?:\/\/github\.com\//, "").replace(/\/$/, "") || "demo/repo";
    setTimeout(() => {
      setData(generateMockAnalysis(name));
      setLoading(false);
    }, 1800);
  };

  const chartData = data?.files.slice(0, 10).map(f => ({
    name: f.file.split('/').pop(),
    ai: Math.round(f.aiLikelihood * 100),
    tech: Math.round(f.technicalDebt * 100),
    cog: Math.round(f.cognitiveDebt * 100),
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

        {loading && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-primary font-mono">Running analysis pipeline...</span>
            </div>
          </div>
        )}

        {data && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 space-y-8"
          >
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground font-mono">{data.repoName}</h2>
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

            {/* Chart */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Debt Distribution by File</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220, 18%, 7%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(210, 20%, 92%)" }}
                  />
                  <Bar dataKey="ai" name="AI Likelihood" radius={[4, 4, 0, 0]}>
                    {chartData?.map((_, i) => (
                      <Cell key={i} fill="hsl(174, 72%, 52%)" fillOpacity={0.7} />
                    ))}
                  </Bar>
                  <Bar dataKey="tech" name="Tech Debt" radius={[4, 4, 0, 0]}>
                    {chartData?.map((_, i) => (
                      <Cell key={i} fill="hsl(36, 95%, 58%)" fillOpacity={0.7} />
                    ))}
                  </Bar>
                  <Bar dataKey="cog" name="Cognitive" radius={[4, 4, 0, 0]}>
                    {chartData?.map((_, i) => (
                      <Cell key={i} fill="hsl(270, 72%, 62%)" fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
