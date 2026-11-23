import type { CursorPosition, RunStatus } from "../types";

type Props = {
  status: RunStatus;
  isRuntimeLoading: boolean;
  cursor: CursorPosition;
  engineInfo: {
    name: string;
    version?: string;
  };
};

export function StatusBar({
  status,
  isRuntimeLoading,
  cursor,
  engineInfo,
}: Props) {
  return (
    <footer
      role="status"
      aria-label="Application Status"
      className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-base px-3 font-mono text-[11px] text-text-muted select-none z-20"
    >
      <div className="flex items-center gap-2">
        {isRuntimeLoading ? (
          <>
            <span className="size-1.5 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            <span className="text-warning">Loading runtime…</span>
          </>
        ) : status === "running" ? (
          <>
            <span className="size-1.5 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            <span className="text-warning">Running…</span>
          </>
        ) : status === "error" ? (
          <>
            <span className="size-1.5 rounded-full bg-error" aria-hidden="true" />
            <span className="text-error">Run failed</span>
          </>
        ) : (
          <>
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-text-muted">Ready</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-text-faint tabular-nums">
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <div className="hidden sm:block h-3 w-px bg-border-subtle" aria-hidden="true" />
        <span className="hidden sm:inline text-text-muted">
          {engineInfo.name} {engineInfo.version ?? ""}
        </span>
        <div className="hidden sm:block h-3 w-px bg-border-subtle" aria-hidden="true" />
        <span className="hidden sm:inline text-text-faint">UTF-8</span>
      </div>
    </footer>
  );
}
