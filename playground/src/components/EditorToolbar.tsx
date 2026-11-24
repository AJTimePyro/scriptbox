import { useState, useMemo } from "react";
import { Check, Copy, Play, RotateCcw, Loader2, Square } from "lucide-react";
import { LanguageSelect, type LanguageStateMap } from "./LanguageSelect";
import type { LanguageDefinition } from "../config/languages";
import type { RunStatus } from "../types";

type Props = {
  languages: LanguageDefinition[];
  selectedLanguage: LanguageDefinition;
  runtimeStates: LanguageStateMap;
  status: RunStatus;
  isRuntimeLoading: boolean;
  canReset: boolean;
  onSelectLanguage: (id: string) => void;
  onReset: () => void;
  onRun: () => void;
  onStop: () => void;
  onCopyCode: () => Promise<boolean>;
  isMobile?: boolean;
};

export function EditorToolbar({
  languages,
  selectedLanguage,
  runtimeStates,
  status,
  isRuntimeLoading,
  canReset,
  onSelectLanguage,
  onReset,
  onRun,
  onStop,
  onCopyCode,
  isMobile = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shortcutHint = useMemo(() => {
    if (typeof window === "undefined") return "Ctrl+Enter";
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(
      navigator.userAgent || navigator.platform || "",
    );
    return isMac ? "Cmd+Enter" : "Ctrl+Enter";
  }, []);

  const handleCopy = async () => {
    if (!(await onCopyCode())) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const isBusy = status === "running" || isRuntimeLoading;

  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-3 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <LanguageSelect
          languages={languages}
          selectedId={selectedLanguage.id}
          runtimeStates={runtimeStates}
          onSelect={onSelectLanguage}
          isMobile={isMobile}
        />

        <button
          type="button"
          onClick={onRun}
          disabled={isBusy}
          aria-label={
            isRuntimeLoading
              ? `Loading ${selectedLanguage.name} runtime`
              : status === "running"
              ? "Running code"
              : `Run code (${shortcutHint})`
          }
          className="inline-flex min-h-[30px] items-center gap-1.5 rounded bg-accent px-3 py-1 font-mono text-xs font-semibold text-accent-fg shadow-xs transition-all duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {isRuntimeLoading ? (
            <>
              <Loader2 size={13} className="animate-spin text-accent-fg" strokeWidth={2} />
              <span>Loading {selectedLanguage.name} runtime…</span>
            </>
          ) : status === "running" ? (
            <>
              <Loader2 size={13} className="animate-spin text-accent-fg" strokeWidth={2} />
              <span>Running…</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current" strokeWidth={1.5} />
              <span>Run</span>
              <kbd className="ml-1.5 hidden items-center rounded border border-black/25 bg-[rgba(0,0,0,0.12)] px-1 font-mono text-[11px] font-normal leading-none text-accent-fg whitespace-nowrap sm:inline-flex">
                {shortcutHint}
              </kbd>
            </>
          )}
        </button>

        {/* Stop terminates the worker; a CPU-bound WASM loop cannot be interrupted in place */}
        {isBusy && (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop run"
            title="Stop run"
            className="inline-flex min-h-[30px] items-center gap-1.5 rounded border border-error/60 bg-error/10 px-2.5 py-1 font-mono text-xs font-semibold text-error transition-colors duration-150 hover:bg-error/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error"
          >
            <Square size={11} className="fill-current" strokeWidth={2} />
            <span>Stop</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          disabled={isBusy || !canReset}
          aria-label="Reset code to starter snippet"
          title="Reset code template"
          className="inline-flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs text-text-muted hover:bg-elevated hover:text-text transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <RotateCcw size={13} strokeWidth={1.5} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy editor code"
          title="Copy code"
          className="inline-flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs text-text-muted hover:bg-elevated hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          {copied ? (
            <>
              <Check size={13} className="text-accent" strokeWidth={1.5} />
              <span className="text-accent hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} strokeWidth={1.5} />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
