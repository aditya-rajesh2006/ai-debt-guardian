import { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Loader2, Search } from "lucide-react";

interface Props {
  onAnalyze: (url: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center rounded-xl border border-border bg-card p-1.5 transition-all focus-within:border-primary/50 focus-within:glow-cyan">
        <GitBranch className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </motion.button>
      </div>
    </form>
  );
}
