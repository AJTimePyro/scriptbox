import { BookOpen, Code2 } from "lucide-react";
import { RuntimeStatusPopover } from "./RuntimeStatusPopover";
import { GITHUB_REPO_URL, DOCS_URL } from "../config/constants";
import { getHeaderDescription } from "../config/languages";
import type { LanguageRuntimeInfo } from "../types";

type Props = {
  runtimes: LanguageRuntimeInfo[];
  onOpenInstallModal: () => void;
};

export function Header({ runtimes, onOpenInstallModal }: Props) {
  const headerDescription = getHeaderDescription();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-3.5 select-none z-30">
      <div className="flex items-center gap-3 min-w-0">
        <a
          href="/"
          className="flex items-center gap-2.5 text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded py-1"
          aria-label="ScriptBox Home"
        >
          <svg
            className="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="20"
              height="20"
              rx="3"
              className="stroke-border fill-elevated"
              strokeWidth="1.75"
            />
            <rect x="6.5" y="6.5" width="3.5" height="11" rx="0.5" className="fill-accent" />
          </svg>
          <span className="font-mono text-sm font-semibold tracking-tight text-text">
            ScriptBox
          </span>
        </a>

        <div className="hidden h-3.5 w-px bg-border sm:block" aria-hidden="true" />

        <p className="hidden text-xs text-text-muted lg:block truncate">
          {headerDescription}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded border border-border-subtle bg-base px-2 py-0.5 font-mono text-[11px] text-text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>100% client-side</span>
        </div>

        <RuntimeStatusPopover runtimes={runtimes} />

        <a
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Documentation"
          title="Documentation"
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-transparent p-1.5 text-text-muted hover:border-border hover:bg-elevated hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <BookOpen size={15} strokeWidth={1.5} />
        </a>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub Repository"
          title="GitHub Repository"
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-transparent p-1.5 text-text-muted hover:border-border hover:bg-elevated hover:text-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <svg
            className="size-4 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </a>

        <button
          type="button"
          onClick={onOpenInstallModal}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded border border-border bg-elevated px-2.5 py-1 text-xs font-mono text-text hover:bg-surface hover:border-accent/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <Code2 size={13} className="text-accent" strokeWidth={1.5} />
          <span className="hidden sm:inline">Use in your project</span>
          <span className="sm:hidden">Install</span>
        </button>
      </div>
    </header>
  );
}
