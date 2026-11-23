import { useState, useRef, useEffect } from "react";
import { Activity } from "lucide-react";
import type { LanguageRuntimeInfo } from "../types";
import { formatDuration, formatTransfer } from "../utils/timing";
import { RuntimeDot } from "./RuntimeDot";

type Props = {
  runtimes: LanguageRuntimeInfo[];
};

export function RuntimeStatusPopover({ runtimes }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const readyCount = runtimes.filter((r) => r.state === "ready").length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="View language runtime statuses"
        className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-mono transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
          isOpen
            ? "border-border bg-elevated text-text"
            : "border-border-subtle bg-surface text-text-muted hover:border-border hover:text-text"
        }`}
      >
        <Activity size={13} className="text-accent" strokeWidth={1.5} />
        <span className="hidden sm:inline">Runtimes</span>
        <span className="text-[11px] text-text-faint">({readyCount}/{runtimes.length})</span>
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Runtime status panel"
          className="absolute right-0 top-full mt-2 w-72 rounded-md border border-border bg-elevated p-3 shadow-xl z-30 font-mono"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
              WASM Runtimes
            </span>
            <span className="text-[10px] font-mono text-accent">100% in-browser</span>
          </div>

          <div className="space-y-2">
            {runtimes.map((runtime) => {
              const formattedSize = formatTransfer(runtime.transferBytes, runtime.isFromCache ?? false);

              return (
                <div
                  key={runtime.id}
                  className="flex items-center justify-between rounded bg-surface/70 px-2.5 py-2 border border-border-subtle text-xs"
                >
                  <div className="flex items-center gap-2">
                    <RuntimeDot state={runtime.state} />

                    <div>
                      <div className="font-mono font-medium text-text">
                        {runtime.label}
                      </div>
                      <div className="text-[10px] text-text-faint">
                        {runtime.engineName} {runtime.version}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    {runtime.state === "unloaded" && (
                      <span className="text-text-faint">unloaded</span>
                    )}
                    {runtime.state === "loading" && (
                      <span className="text-warning">loading...</span>
                    )}
                    {runtime.state === "ready" && (
                      <div className="text-accent">
                        ready
                        {runtime.loadMs !== null && (
                          <div className="text-[10px] text-text-faint">
                            {formatDuration(runtime.loadMs)}
                            {formattedSize ? ` · ${formattedSize}` : ""}
                          </div>
                        )}
                      </div>
                    )}
                    {runtime.state === "failed" && (
                      <span className="text-error">error</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-2.5 text-[10px] text-text-faint leading-normal">
            Engines initialize upon first execution and run completely inside your browser client.
          </p>
        </div>
      )}
    </div>
  );
}
