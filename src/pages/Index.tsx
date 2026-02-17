import { motion } from "framer-motion";
import { ArrowRight, Brain, Code, GitFork, BarChart3, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const features = [
  { icon: Code, title: "AI Code Detection", desc: "Heuristic-based identification of AI-generated patterns in your codebase" },
  { icon: Brain, title: "Cognitive Debt Analysis", desc: "Measure how AI code impacts readability and comprehension" },
  { icon: GitFork, title: "Propagation Tracking", desc: "Visualize how AI-induced debt spreads across your system" },
  { icon: BarChart3, title: "Unified Metrics", desc: "Combined scoring from PMD, SonarQube, and custom heuristics" },
  { icon: Zap, title: "Actionable Insights", desc: "Know exactly what to refactor first for maximum impact" },
  { icon: Shield, title: "Quality Gate", desc: "Prevent new AI-induced debt from entering your codebase" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="container relative">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Brain className="h-3.5 w-3.5" />
              AI-Induced Debt Detection
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-foreground">Track the</span>{" "}
              <span className="text-gradient-cyber">hidden cost</span>
              <br />
              <span className="text-foreground">of AI code</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              The first platform to detect, measure, and visualize technical & cognitive debt
              specifically introduced by AI-generated code.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 glow-cyan"
              >
                Analyze Repository <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/problem"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Built for the AI era</h2>
            <p className="mt-2 text-sm text-muted-foreground">Unlike traditional tools, we focus on AI-specific debt patterns</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:glow-cyan"
              >
                <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4">
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
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to audit your AI debt?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Paste any GitHub repo URL and get instant analysis</p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground glow-cyan"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
