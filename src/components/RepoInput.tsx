import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Loader2, Search, Key, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onAnalyze: (url: string, token?: string) => void;
  loading?: boolean;
}

export default function RepoInput({ onAnalyze, loading }: Props) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidGitHubUrl = (input: string) => {
    const cleaned = input.replace(/\/$/, '').replace(/\.git$/, '');
    return /github\.com\/[^/]+\/[^/]+/.test(cleaned) ||
    cleaned.split('/').filter(Boolean).length >= 2;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidGitHubUrl(trimmed)) {
      setValidationError("Please enter a valid GitHub URL, e.g. https://github.com/owner/repo");
      return;
    }
    setValidationError(null);
    onAnalyze(trimmed, token.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-2">
      <div className={`relative flex items-center rounded-xl border bg-card p-1.5 transition-all focus-within:border-primary/50 ${validationError ? 'border-destructive' : 'border-border'}`}>
        <GitBranch className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => {setUrl(e.target.value);if (validationError) setValidationError(null);}}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !url.trim()}
          className="gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-40 flex-row flex items-center justify-start"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Analyze
        </motion.button>
      </div>

      {/* Private repo token toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Key className="h-3 w-3" />
          {showToken ? "Hide" : "Private repo?"} Access Token
          {showToken ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      <AnimatePresence>
        {showToken && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground">
                Paste a <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Personal Access Token</a> to analyze private repositories. Token is used for this session only and never stored.
              </p>
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-neon-purple shrink-0" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-transparent rounded-md border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono"
                />
              </div>
              {token && (
                <p className="text-[10px] text-neon-green flex items-center gap-1">
                  ✓ Token provided — will be used for this analysis only
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {validationError && <p className="text-xs text-destructive text-center">{validationError}</p>}
    </form>
  );
}
