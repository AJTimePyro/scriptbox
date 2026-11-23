import { useState, useEffect } from "react";
import { Check, Copy, X } from "lucide-react";
import { INSTALL_SNIPPET } from "../constants";
import { copyText } from "../utils/clipboard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function InstallModal({ isOpen, onClose }: Props) {
  const [selectedPm, setSelectedPm] = useState<"npm" | "pnpm" | "yarn">("npm");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const command =
    selectedPm === "npm"
      ? INSTALL_SNIPPET.packageManager
      : selectedPm === "pnpm"
      ? INSTALL_SNIPPET.pnpm
      : INSTALL_SNIPPET.yarn;

  const copyCommand = async () => {
    if (!(await copyText(command))) return;
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1400);
  };

  const copySnippet = async () => {
    if (!(await copyText(INSTALL_SNIPPET.usage))) return;
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg rounded-md border border-border bg-elevated p-5 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
              SDK Integration
            </span>
            <span className="text-xs text-text-muted">/</span>
            <h2 id="modal-title" className="text-sm font-medium text-text">
              Use in your project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-text-muted hover:bg-surface hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                Installation
              </span>
              <div className="flex gap-1">
                {(["npm", "pnpm", "yarn"] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setSelectedPm(pm)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors duration-150 ${
                      selectedPm === pm
                        ? "bg-surface text-text border border-border"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded bg-surface border border-border-subtle px-3 py-2">
              <code className="font-mono text-xs text-text selection:bg-accent/30">
                {command}
              </code>
              <button
                type="button"
                onClick={copyCommand}
                aria-label="Copy install command"
                className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono text-text-muted hover:bg-elevated hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                {copiedCmd ? (
                  <>
                    <Check size={13} className="text-accent" strokeWidth={1.5} />
                    <span className="text-accent">copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={1.5} />
                    <span>copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                Quick Start
              </span>
              <button
                type="button"
                onClick={copySnippet}
                aria-label="Copy code snippet"
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono text-text-muted hover:bg-surface hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                {copiedSnippet ? (
                  <>
                    <Check size={13} className="text-accent" strokeWidth={1.5} />
                    <span className="text-accent">copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={1.5} />
                    <span>copy snippet</span>
                  </>
                )}
              </button>
            </div>
            <pre className="m-0 max-h-56 overflow-auto rounded border border-border-subtle bg-surface p-3 font-mono text-xs leading-relaxed text-text selection:bg-accent/30">
              <code>{INSTALL_SNIPPET.usage}</code>
            </pre>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-base transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
