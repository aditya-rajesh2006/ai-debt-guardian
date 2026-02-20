import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 60 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 60 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Blob 1 – primary cyan */}
      <motion.div
        className="absolute rounded-full blur-[120px] opacity-25 dark:opacity-20 bg-primary"
        style={{
          width: 700, height: 700,
          top: "10%", left: "15%",
          x: smoothX.get() * -30,
          y: smoothY.get() * -30,
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blob 2 – neon purple */}
      <motion.div
        className="absolute rounded-full blur-[140px] opacity-20 dark:opacity-15"
        style={{
          width: 600, height: 600,
          top: "40%", right: "10%",
          background: "hsl(var(--neon-purple))",
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Blob 3 – pink/magenta accent */}
      <motion.div
        className="absolute rounded-full blur-[160px] opacity-15 dark:opacity-10"
        style={{
          width: 500, height: 500,
          bottom: "5%", left: "40%",
          background: "hsl(320 70% 58%)",
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Floating network nodes */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/20 bg-primary/5"
          style={{
            width: 6 + (i % 3) * 4,
            height: 6 + (i % 3) * 4,
            left: `${10 + i * 7.5}%`,
            top: `${15 + (i % 5) * 16}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}

      {/* Connecting lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <line x1="15%" y1="22%" x2="40%" y2="55%" stroke="hsl(var(--primary))" strokeWidth="0.5" />
        <line x1="40%" y1="55%" x2="70%" y2="30%" stroke="hsl(var(--neon-purple))" strokeWidth="0.5" />
        <line x1="70%" y1="30%" x2="90%" y2="60%" stroke="hsl(var(--primary))" strokeWidth="0.5" />
        <line x1="25%" y1="70%" x2="55%" y2="40%" stroke="hsl(var(--neon-purple))" strokeWidth="0.5" />
        <line x1="55%" y1="40%" x2="85%" y2="75%" stroke="hsl(var(--primary))" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
