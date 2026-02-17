import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-bold text-foreground">
              AI<span className="text-primary">Debt</span>Tracker
            </span>
          </Link>
          <p className="text-xs text-muted-foreground max-w-md">
            Detect, measure, and visualize technical & cognitive debt introduced by AI-generated code.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-[10px] text-muted-foreground/60">© 2026 AIDebtTracker. Built to keep AI accountable.</p>
        </div>
      </div>
    </footer>
  );
}
