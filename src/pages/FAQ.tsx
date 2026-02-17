import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqs = [
  { q: "How does the AI detection work?", a: "We use heuristic-based pattern matching — detecting overly generic variable names, repetitive structures, unusual verbosity, inconsistent naming conventions, and excessive obvious comments. No heavy ML models required." },
  { q: "Is the analysis accurate?", a: "Our scoring is approximate by design. The goal is explainability and actionable insights, not perfect precision. Metrics are calibrated against known AI-generated code samples." },
  { q: "What tools does the system integrate?", a: "We combine GitHub API (commits, files, contributors), PMD (code smells, complexity), SonarQube (maintainability index), and Tree-sitter (AST parsing for structure analysis)." },
  { q: "What is 'cognitive debt'?", a: "Cognitive debt measures how much mental effort is required to understand code. AI-generated code often looks correct but uses patterns that increase comprehension difficulty — we quantify this with CCD, ES, AES, and RDI metrics." },
  { q: "Can I use this on private repositories?", a: "Currently the tool analyzes public GitHub repositories. Private repo support requires authentication and is planned for a future release." },
  { q: "How is propagation tracked?", a: "We analyze import chains, code clones, reused patterns, and commit history to map how AI-introduced patterns spread across the codebase." },
  { q: "What languages are supported?", a: "The heuristic engine works on any text-based code file. AST-based analysis via Tree-sitter currently supports JavaScript, TypeScript, Python, and Java." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">FAQ</h1>
          <p className="mt-4 text-muted-foreground">Common questions about AI-induced debt tracking</p>
        </motion.div>

        <div className="mx-auto max-w-2xl space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
              >
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
