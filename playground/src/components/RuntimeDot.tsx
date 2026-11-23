import type { RuntimeState } from "../types";

const DOT_CLASS: Record<RuntimeState, string> = {
  unloaded: "border border-text-faint bg-transparent",
  loading: "bg-warning animate-pulse",
  ready: "bg-accent",
  failed: "bg-error",
};

const DOT_TITLE: Record<RuntimeState, string> = {
  unloaded: "Runtime not loaded",
  loading: "Runtime loading…",
  ready: "Runtime ready",
  failed: "Runtime failed",
};

/** Small state dot shared by the language selector and the runtime popover. */
export function RuntimeDot({
  state,
  labelled = false,
}: {
  state: RuntimeState;
  labelled?: boolean;
}) {
  const title = DOT_TITLE[state];
  return (
    <span
      className={`size-2 rounded-full shrink-0 ${DOT_CLASS[state]}`}
      title={title}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    />
  );
}
