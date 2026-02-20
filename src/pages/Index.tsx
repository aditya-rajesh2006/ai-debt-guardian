import { motion } from "framer-motion";
import { ArrowRight, Brain, Code, GitFork, BarChart3, Zap, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import RepoInput from "@/components/RepoInput";
import { useNavigate } from "react-router-dom";

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

const features = [
  { icon: Code, title: "AI Code Detection", desc: "Heuristic-based identification of AI-generated patterns" },
  { icon: Brain, title: "Cognitive Debt Analysis", desc: "Measure how AI code impacts readability and comprehension" },
  { icon: GitFork, title: "Propagation Tracking", desc: "Visualize how AI-induced debt spreads across your system" },
  { icon: BarChart3, title: "Unified Metrics", desc: "Combined scoring from PMD, SonarQube, and custom heuristics" },
  { icon: Zap, title: "Actionable Insights", desc: "Know exactly what to refactor first for maximum impact" },
  { icon: Shield, title: "Quality Gate", desc: "Prevent new AI-induced debt from entering your codebase" },
];

const stats = [
  { value: "85%", label: "Detection Accuracy", icon: TrendingUp },
  { value: "7+", label: "Debt Metrics", icon: BarChart3 },
  { value: "<30s", label: "Analysis Time", icon: Zap },
  { value: "100%", label: "Open Heuristics", icon: AlertTriangle },
];

export default function Home() {
  const navigate = useNavigate();

  const handleQuickAnalyze = (url: string) => {
    navigate(`/dashboard?repo=${encodeURIComponent(url)}`);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 backdrop-blur-sm"
            >
              <Brain className="h-3.5 w-3.5" />
              AI-Induced Technical Debt Detection
            </motion.div>

            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-foreground">Track the</span>{" "}
              <span className="text-gradient-cyber">hidden cost</span>
              <br />
              <span className="text-foreground">of AI code</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              The first platform to detect, measure, and visualize technical & cognitive debt
              specifically introduced by AI-generated code.
            </p>

            {/* Inline repo input */}
            <div className="mt-10">
              <RepoInput onAnalyze={handleQuickAnalyze} loading={false} />
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 glow-cyan"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl mx-auto"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 text-center"
              >
                <s.icon className="h-4 w-4 text-primary mx-auto mb-2" />
                <div className="text-2xl font-black text-foreground font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Built for the AI era</h2>
            <p className="mt-2 text-sm text-muted-foreground">Unlike traditional tools, we focus on AI-specific debt patterns</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i }}
                whileHover={{ y: -4, boxShadow: "0 0 30px hsl(var(--primary) / 0.15)" }}
                className="group rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 transition-all hover:border-primary/30 cursor-default"
              >
                <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-lg text-center"
          >
            <h2 className="text-2xl font-bold text-foreground">Ready to audit your AI debt?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Paste any GitHub repo URL and get instant analysis</p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground glow-cyan hover:opacity-90 transition-opacity"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
