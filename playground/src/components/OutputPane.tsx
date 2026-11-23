import { useState, useMemo } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { RunReport } from "./RunReport";
import { copyText } from "../utils/clipboard";
import { splitOutputLines, summarizeOutput } from "../utils/output";
import type { OutputFilter, RunMetrics, RunOutput, RunStatus } from "../types";

type Props = {
  output: RunOutput;
  status: RunStatus;
  metrics: RunMetrics;
  isInterpreted: boolean;
  onClear: () => void;
};

const MAX_DISPLAY_LINES = 1000;

export function OutputPane({
  output,
  status,
  metrics,
  isInterpreted,
  onClear,
}: Props) {
  const [filter, setFilter] = useState<OutputFilter>("all");
  const [copied, setCopied] = useState(false);

  const shortcutHint = useMemo(() => {
    if (typeof window === "undefined") return "Ctrl+↵";
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(
      navigator.userAgent || navigator.platform || "",
    );
    return isMac ? "Cmd+Enter" : "Ctrl+Enter";
  }, []);

  const stdoutText = output.stdout || "";
  const stderrText = output.stderr || "";

  const stdoutLines = splitOutputLines(stdoutText);
  const stderrLines = splitOutputLines(stderrText);
  const { shown: shownCount, total: totalCount, isTruncated } = summarizeOutput(
    stdoutLines,
    stderrLines,
    MAX_DISPLAY_LINES,
  );

  const hasOutput = stdoutText.length > 0 || stderrText.length > 0;
  const isRunning = status === "running" || status === "loading";

  const visibleText = useMemo(() => {
    if (filter === "stdout") return stdoutText;
    if (filter === "stderr") return stderrText;
    if (stdoutText && stderrText) return `${stdoutText}\n\n${stderrText}`;
    return stdoutText || stderrText;
  }, [filter, stdoutText, stderrText]);

  const handleCopy = async () => {
    if (!visibleText) return;
    if (!(await copyText(visibleText))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section
      aria-label="Execution Output"
      className="relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-base"
    >
      <div className="relative h-0.5 w-full overflow-hidden bg-border-subtle shrink-0">
        {isRunning && (
          <div
            className="absolute top-0 bottom-0 w-1/3 bg-accent animate-progress-slide"
            role="progressbar"
            aria-label="Running code"
          />
        )}
      </div>

      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-3 select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-faint">
            Output
          </span>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className={`rounded px-2 py-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                filter === "all"
                  ? "bg-elevated text-text border border-border"
                  : totalCount === 0
                  ? "text-text-faint hover:text-text-muted"
                  : "text-text-muted hover:text-text"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("stdout")}
              aria-pressed={filter === "stdout"}
              className={`rounded px-2 py-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                filter === "stdout"
                  ? "bg-elevated text-text border border-border"
                  : stdoutLines.length === 0
                  ? "text-text-faint hover:text-text-muted"
                  : "text-text-muted hover:text-text"
              }`}
            >
              stdout ({stdoutLines.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("stderr")}
              aria-pressed={filter === "stderr"}
              className={`rounded px-2 py-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                filter === "stderr"
                  ? "bg-elevated text-error border border-border"
                  : stderrLines.length === 0
                  ? "text-text-faint hover:text-text-muted"
                  : "text-error/80 hover:text-error"
              }`}
            >
              stderr ({stderrLines.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasOutput}
            aria-label="Copy output"
            title="Copy output"
            className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded p-1 text-text-muted hover:bg-elevated hover:text-text transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {copied ? (
              <Check size={13} className="text-accent" strokeWidth={1.5} />
            ) : (
              <Copy size={13} strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={isRunning || (!hasOutput && status === "idle")}
            aria-label="Clear output"
            title="Clear output"
            className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded p-1 text-text-muted hover:bg-elevated hover:text-text transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-accent/25">
        {!hasOutput && status === "idle" ? (
          <div className="terminal-grid absolute inset-0 flex flex-col items-start justify-center p-6 text-text-faint select-none">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="text-accent font-semibold">$</span>
              <span>run your code to see output</span>
              <span className="animate-cursor-blink inline-block text-accent font-bold">
                ▋
              </span>
            </div>
            <p className="mt-2 text-xs text-text-faint">
              Press{" "}
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-muted">
                {shortcutHint}
              </kbd>{" "}
              or click Run
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(filter === "all" || filter === "stdout") && stdoutText && (
              <div className="whitespace-pre-wrap break-words text-text">
                {stdoutLines.slice(0, MAX_DISPLAY_LINES).map((line, idx) => (
                  <div key={idx} className="min-h-[1.4em]">
                    {line}
                  </div>
                ))}
              </div>
            )}

            {(filter === "all" || filter === "stderr") && stderrText && (
              <div className="rounded-r border-l-2 border-error/70 bg-error/5 py-1.5 pl-3 whitespace-pre-wrap break-words text-error">
                {stderrLines.slice(0, MAX_DISPLAY_LINES).map((line, idx) => (
                  <div key={idx} className="min-h-[1.4em]">
                    {line}
                  </div>
                ))}
              </div>
            )}

            {isTruncated && (
              <div className="rounded border border-border-subtle bg-elevated p-2 text-[11px] text-text-faint">
                Output truncated: showing first {shownCount} of {totalCount} lines.
              </div>
            )}

            {status === "done" && (
              <div className="pt-2 flex items-center gap-1.5 text-xs text-accent select-none">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                <span>exited {output.exitCode ?? 0}</span>
              </div>
            )}

            {status === "error" && (
              <div className="pt-2 flex items-center gap-1.5 text-xs text-error select-none">
                <span className="size-1.5 rounded-full bg-error" aria-hidden="true" />
                <span>
                  exited with error
                  {output.exitCode !== undefined ? ` (${output.exitCode})` : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <RunReport metrics={metrics} isInterpreted={isInterpreted} />
    </section>
  );
}
