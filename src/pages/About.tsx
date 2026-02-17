import { motion } from "framer-motion";
import { Brain, Users, Target, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">About</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We believe AI is transforming software development — but someone needs to track the costs.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {[
            { icon: Target, title: "Mission", desc: "Make the hidden cost of AI-generated code visible, measurable, and actionable." },
            { icon: Brain, title: "Approach", desc: "Combine traditional static analysis with novel AI-specific heuristics for comprehensive debt detection." },
            { icon: Users, title: "For Teams", desc: "Built for engineering teams who use AI assistants daily and want to maintain code quality." },
            { icon: Rocket, title: "Vision", desc: "A world where AI-assisted development is transparent, accountable, and continuously improving." },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4"><item.icon className="h-5 w-5 text-primary" /></div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
