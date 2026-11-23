import assert from "node:assert/strict";
import test from "node:test";
import { formatTransfer, measureResourceTransfer } from "./timing.ts";

type Entry = {
  name: string;
  startTime: number;
  transferSize: number;
  decodedBodySize: number;
  encodedBodySize?: number;
};

function withResourceEntries(entries: Entry[], assertion: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, "performance");
  const fake = {
    getEntriesByType: (type: string) => (type === "resource" ? entries : []),
  };
  Object.defineProperty(globalThis, "performance", {
    configurable: true,
    writable: true,
    value: fake,
  });
  try {
    assertion();
  } finally {
    if (original) Object.defineProperty(globalThis, "performance", original);
  }
}

test("sums transferSize of resources loaded inside the window", () => {
  withResourceEntries(
    [
      { name: "https://cdn.example/a.js", startTime: 100, transferSize: 500, decodedBodySize: 1000 },
      { name: "https://cdn.example/b.wasm", startTime: 200, transferSize: 1500, decodedBodySize: 2000 },
      { name: "https://cdn.example/after.js", startTime: 9000, transferSize: 999, decodedBodySize: 999 },
    ],
    () => {
      assert.deepEqual(measureResourceTransfer(50, 300), {
        transferBytes: 2000,
        isFromCache: false,
      });
    },
  );
});

test("all cache hits report their encoded body size", () => {
  withResourceEntries(
    [
      { name: "https://cdn.example/a.js", startTime: 100, transferSize: 0, decodedBodySize: 1000, encodedBodySize: 600 },
      { name: "https://cdn.example/b.wasm", startTime: 200, transferSize: 0, decodedBodySize: 2000, encodedBodySize: 900 },
    ],
    () => {
      assert.deepEqual(measureResourceTransfer(50, 300), {
        transferBytes: 1500,
        isFromCache: true,
      });
    },
  );
});

test("cached entries without encodedBodySize fall back to decodedBodySize", () => {
  withResourceEntries(
    [{ name: "https://cdn.example/a.js", startTime: 100, transferSize: 0, decodedBodySize: 1000 }],
    () => {
      assert.deepEqual(measureResourceTransfer(50, 300), {
        transferBytes: 1000,
        isFromCache: true,
      });
    },
  );
});

test("cached size gets a (cache) label", () => {
  assert.equal(formatTransfer(5 * 1024 * 1024, true), "5.0 MB (cache)");
  assert.equal(formatTransfer(null, true), "from cache");
  assert.equal(formatTransfer(2 * 1024, false), "2 KB");
});

test("a zero transferSize without decoded bytes is unreliable", () => {
  withResourceEntries(
    [{ name: "https://cdn.example/a.js", startTime: 100, transferSize: 0, decodedBodySize: 0 }],
    () => {
      assert.deepEqual(measureResourceTransfer(50, 300), {
        transferBytes: null,
        isFromCache: false,
      });
    },
  );
});

test("no resources in the window means nothing to report", () => {
  withResourceEntries([], () => {
    assert.deepEqual(measureResourceTransfer(50, 300), {
      transferBytes: null,
      isFromCache: false,
    });
  });
});
