import { motion } from "framer-motion";
import { Brain, Users, Target, Rocket, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

const mission = [
  { icon: Target, title: "Mission", desc: "Make the hidden cost of AI-generated code visible, measurable, and actionable for every engineering team." },
  { icon: Brain, title: "Approach", desc: "Combine traditional static analysis with novel AI-specific heuristics for comprehensive debt detection without ML overhead." },
  { icon: Users, title: "For Teams", desc: "Built for engineering teams who use AI assistants daily and want to maintain long-term code quality and maintainability." },
  { icon: Rocket, title: "Vision", desc: "A world where AI-assisted development is transparent, accountable, and continuously improving through data." },
];

const faqs = [
  { q: "How does the AI detection work?", a: "We use heuristic-based pattern matching — detecting overly generic variable names, repetitive structures, unusual verbosity, inconsistent naming conventions, and excessive obvious comments. No heavy ML models required." },
  { q: "Is the analysis accurate?", a: "Our scoring is approximate by design. The goal is explainability and actionable insights, not perfect precision. Metrics are calibrated against known AI-generated code samples." },
  { q: "What tools does the system integrate?", a: "We combine GitHub API (commits, files, contributors), PMD (code smells, complexity), SonarQube (maintainability index), and Tree-sitter (AST parsing for structure analysis)." },
  { q: "What is 'cognitive debt'?", a: "Cognitive debt measures how much mental effort is required to understand code. AI-generated code often looks correct but uses patterns that increase comprehension difficulty — we quantify this with CCD, ES, AES, and RDI metrics." },
  { q: "Can I use this on private repositories?", a: "Currently the tool analyzes public GitHub repositories. Private repo support requires authentication and is planned for a future release." },
  { q: "How is propagation tracked?", a: "We analyze import chains, code clones, reused patterns, and commit history to map how AI-introduced patterns spread across the codebase." },
  { q: "What languages are supported?", a: "The heuristic engine works on any text-based code file. AST-based analysis via Tree-sitter currently supports JavaScript, TypeScript, Python, and Java." },
];

const team = [
  { name: "Research Lead", role: "AI & Heuristics", initials: "RL" },
  { name: "Platform Eng.", role: "Backend & APIs", initials: "PE" },
  { name: "Frontend Dev", role: "UI & Visualization", initials: "FD" },
];

export default function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10 container pt-24 pb-16 space-y-20">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black text-foreground sm:text-4xl">About <span className="text-gradient-cyber">AIDebt</span></h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe AI is transforming software development — but someone needs to track the costs.
          </p>
        </motion.div>

        {/* Mission cards */}
        <div className="grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto">
          {mission.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 transition-all hover:border-primary/30"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4"><item.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Team */}
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-foreground text-center mb-8"
          >
            Team
          </motion.h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {team.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary text-sm">
                  {t.initials}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-foreground text-center mb-8"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card/70 backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
