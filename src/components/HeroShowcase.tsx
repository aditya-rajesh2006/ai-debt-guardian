import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import heroDashboard from "@/assets/hero-dashboard.png";
import heroGraph from "@/assets/hero-graph.png";
import heroAiDetect from "@/assets/hero-ai-detect.png";

const slides = [
  { src: heroDashboard, alt: "AI Debt Dashboard — holographic metrics visualization", label: "Dashboard Analysis" },
  { src: heroGraph, alt: "Debt Propagation Graph — nodes spreading across codebase", label: "Propagation Graph" },
  { src: heroAiDetect, alt: "AI vs Human code detection split view", label: "AI Detection" },
];

export default function HeroShowcase() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto mt-14 max-w-3xl">
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />

      {/* Frame */}
      <div className="relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Browser bar */}
        <div className="flex items-center gap-1.5 border-b border-border/50 px-3 py-2 bg-card/60">
          <span className="h-2 w-2 rounded-full bg-destructive/60" />
          <span className="h-2 w-2 rounded-full bg-accent/60" />
          <span className="h-2 w-2 rounded-full bg-neon-green/60" />
          <span className="ml-2 text-[9px] text-muted-foreground font-mono">aidebt.dev/dashboard</span>
        </div>

        {/* Image carousel */}
        <div className="relative aspect-video">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={slides[current].src}
              alt={slides[current].alt}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </AnimatePresence>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />

          {/* Label */}
          <div className="absolute bottom-3 left-3">
            <span className="rounded-md bg-card/80 backdrop-blur-sm border border-border/50 px-2.5 py-1 text-[10px] font-medium text-foreground">
              {slides[current].label}
            </span>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
