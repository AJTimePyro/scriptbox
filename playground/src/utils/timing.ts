/**
 * Runtime load timing. Cross-origin resources without Timing-Allow-Origin are
 * skipped rather than estimated.
 */

const observedResourceEntries: PerformanceResourceTiming[] = [];

// Module setup runs in both the page and the engine worker; each has its own resource timeline.
if (typeof performance !== "undefined") {
  if (typeof performance.setResourceTimingBufferSize === "function") {
    try {
      performance.setResourceTimingBufferSize(1000);
    } catch {
    }
  }

  if (typeof PerformanceObserver !== "undefined") {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        for (const entry of entries) {
          observedResourceEntries.push(entry);
        }
      });
      observer.observe({ type: "resource", buffered: true });
    } catch {
    }
  }
}

export type MeasuredTransfer = {
  /** Wire bytes, or the cached body size when isFromCache is true. */
  transferBytes: number | null;
  isFromCache: boolean;
};

/**
 * Aggregate resource entries from one runtime load window.
 * A zero transferSize can mean an HTTP cache hit or a cross-origin entry whose
 * timing data the browser hid, so mixed windows are reported as unknown.
 */
export function measureResourceTransfer(
  startTime: number,
  endTime: number,
): MeasuredTransfer {
  if (typeof performance === "undefined") {
    return { transferBytes: null, isFromCache: false };
  }

  const allEntries: PerformanceResourceTiming[] = [];
  const seenNames = new Set<string>();

  if (typeof performance.getEntriesByType === "function") {
    try {
      const resourceEntries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      for (const e of resourceEntries) {
        const key = `${e.name}_${e.startTime}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          allEntries.push(e);
        }
      }
    } catch {
      // Resource timing can be unavailable; treat the window as unknown.
    }
  }

  for (const e of observedResourceEntries) {
    const key = `${e.name}_${e.startTime}`;
    if (!seenNames.has(key)) {
      seenNames.add(key);
      allEntries.push(e);
    }
  }

  // 30 ms of slack covers entries recorded just outside the load window.
  const windowEntries = allEntries.filter((entry) => {
    if (!entry.name.startsWith("http://") && !entry.name.startsWith("https://")) {
      return false;
    }
    if (
      entry.name.includes("/@vite") ||
      entry.name.includes("/@fs/") ||
      entry.name.includes("/src/") ||
      entry.name.includes("node_modules/.vite")
    ) {
      return false;
    }

    return entry.startTime >= startTime - 30 && entry.startTime <= endTime + 30;
  });

  if (windowEntries.length === 0) {
    return { transferBytes: null, isFromCache: false };
  }

  const isEveryCached = windowEntries.every(
    (e) => e.transferSize === 0 && (e.decodedBodySize || 0) > 0,
  );

  if (isEveryCached) {
    // Cached entries have no wire bytes; encoded body size stays comparable to a fresh transfer.
    const cachedBytes = windowEntries.reduce(
      (acc, e) => acc + (e.encodedBodySize || e.decodedBodySize || 0),
      0,
    );
    return { transferBytes: cachedBytes > 0 ? cachedBytes : null, isFromCache: true };
  }

  // A zero transferSize with no body size means timing data was hidden; do not guess.
  const hasZeroTransfer = windowEntries.some((e) => e.transferSize === 0);
  const totalTransfer = windowEntries.reduce((acc, e) => acc + (e.transferSize || 0), 0);

  if (hasZeroTransfer || totalTransfer <= 0) {
    return { transferBytes: null, isFromCache: false };
  }

  return { transferBytes: totalTransfer, isFromCache: false };
}

export function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "-";
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatBytes(bytes: number | null): string | null {
  if (bytes === null || bytes === undefined || bytes <= 0) return null;
  const ONE_MB = 1024 * 1024;
  const ONE_KB = 1024;
  if (bytes < ONE_MB) {
    return `${Math.round(bytes / ONE_KB)} KB`;
  }
  return `${(bytes / ONE_MB).toFixed(1)} MB`;
}

/** One label for all three runtime-size displays; cached sizes are not wire bytes. */
export function formatTransfer(bytes: number | null, isFromCache: boolean): string | null {
  const size = formatBytes(bytes);
  if (size) return isFromCache ? `${size} (cache)` : size;
  return isFromCache ? "from cache" : null;
}
