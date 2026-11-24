import type { ReactNode } from "react";
import type { RunMetrics } from "../types";
import { formatDuration, formatTransfer } from "../utils/timing";

function MetricCard({
  label,
  emphasis = false,
  children,
}: {
  label: string;
  emphasis?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded border border-border-subtle bg-surface/50 p-1.5 sm:p-2">
      <div className="text-[10px] uppercase tracking-wider text-text-faint">
        {label}
      </div>
      <div
        className={`mt-1 flex items-baseline gap-1.5 flex-wrap text-xs tabular-nums text-text ${
          emphasis ? "font-semibold" : "font-medium"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyCard({
  label,
  text,
  title,
}: {
  label: string;
  text: string;
  title?: string;
}) {
  return (
    <div className="rounded border border-dashed border-border-subtle bg-surface/30 p-1.5 sm:p-2">
      <div className="text-[10px] uppercase tracking-wider text-text-faint">
        {label}
      </div>
      <div className="mt-1 text-[11px] text-text-faint" title={title}>
        <span className="sm:hidden">—</span>
        <span className="hidden sm:inline">{text}</span>
      </div>
    </div>
  );
}

export function RunReport({ metrics, isInterpreted }: { metrics: RunMetrics; isInterpreted: boolean }) {
  const hasRun = metrics.totalMs !== null;

  const formattedSize = formatTransfer(metrics.transferBytes ?? null, metrics.isFromCache ?? false);

  return (
    <div
      role="region"
      aria-label="Run Report"
      className={`shrink-0 border-t border-border bg-elevated/70 p-2 select-none font-mono sm:p-3 ${
        hasRun ? "" : "hidden sm:block"
      }`}
    >
      <div className="flex items-center justify-between pb-1 sm:pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">
          Run Report
        </span>
        <span className="hidden text-[10px] text-text-faint sm:inline">
          this run
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {isInterpreted ? (
          <MetricCard label="Compile">
            <span
              className="cursor-help text-text-faint hover:text-text-muted transition-colors duration-150"
              title="interpreted, no compile step"
            >
              n/a
            </span>
          </MetricCard>
        ) : !hasRun ? (
          <EmptyCard label="Compile" text="not run yet" />
        ) : metrics.compileMs !== null ? (
          <MetricCard label="Compile">{formatDuration(metrics.compileMs)}</MetricCard>
        ) : (
          <EmptyCard
            label="Compile"
            text="not reported"
            title="Not reported by this engine yet"
          />
        )}

        {!hasRun ? (
          <EmptyCard label="Run" text="not run yet" />
        ) : metrics.runMs !== null ? (
          <MetricCard label="Run">{formatDuration(metrics.runMs)}</MetricCard>
        ) : (
          <EmptyCard
            label="Run"
            text="not reported"
            title="Not reported by this engine yet"
          />
        )}

        {!hasRun ? (
          <EmptyCard label="Total" text="not run yet" />
        ) : metrics.totalMs !== null ? (
          <MetricCard label="Total" emphasis>
            {formatDuration(metrics.totalMs)}
          </MetricCard>
        ) : (
          <EmptyCard
            label="Total"
            text="not reported"
            title="Not reported by this engine yet"
          />
        )}

        {metrics.packageLoadMs !== null ? (
          <MetricCard label="Load">
            <span>
              {formatDuration(metrics.packageLoadMs)}
              {formattedSize ? ` · ${formattedSize}` : ""}
            </span>
            {metrics.cached && (
              <span
                className="rounded border border-border bg-surface px-1 py-0.2 text-[9px] uppercase tracking-wider text-accent cursor-help"
                title="loaded once, reused for later runs"
              >
                cached
              </span>
            )}
          </MetricCard>
        ) : !hasRun ? (
          <EmptyCard label="Load" text="not run yet" />
        ) : (
          <EmptyCard
            label="Load"
            text="not reported"
            title="Not reported by this engine yet"
          />
        )}
      </div>
    </div>
  );
}
