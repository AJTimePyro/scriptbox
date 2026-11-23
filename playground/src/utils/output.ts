/** Split streamed output into lines, ignoring the single trailing newline most printers add. */
export function splitOutputLines(text: string): string[] {
  if (!text) return [];
  return (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");
}

/**
 * How many lines are rendered versus printed. Each stream is capped separately,
 * so the truncation notice must count what is actually shown, not the raw total.
 */
export function summarizeOutput(
  stdoutLines: string[],
  stderrLines: string[],
  maxPerStream: number,
): { shown: number; total: number; isTruncated: boolean } {
  const shown =
    Math.min(stdoutLines.length, maxPerStream) + Math.min(stderrLines.length, maxPerStream);
  const total = stdoutLines.length + stderrLines.length;
  return { shown, total, isTruncated: shown < total };
}
