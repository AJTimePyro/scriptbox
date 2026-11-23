import assert from "node:assert/strict";
import test from "node:test";
import { splitOutputLines, summarizeOutput } from "./output.ts";

test("drops the single trailing newline most printers add", () => {
  assert.deepEqual(splitOutputLines("a\nb\n"), ["a", "b"]);
});

test("keeps blank lines inside the output", () => {
  assert.deepEqual(splitOutputLines("a\n\nb"), ["a", "", "b"]);
});

test("no output means no lines", () => {
  assert.deepEqual(splitOutputLines(""), []);
});

test("counts both streams when under the cap", () => {
  const stats = summarizeOutput(Array(600).fill("a"), Array(600).fill("b"), 1000);
  assert.deepEqual(stats, { shown: 1200, total: 1200, isTruncated: false });
});

test("counts only rendered lines and reports the real total", () => {
  const stats = summarizeOutput(Array(1500).fill("a"), [], 1000);
  assert.deepEqual(stats, { shown: 1000, total: 1500, isTruncated: true });
});

test("caps each stream separately, so 1000 stdout + 1000 stderr is not truncated", () => {
  const stats = summarizeOutput(Array(1000).fill("a"), Array(1000).fill("b"), 1000);
  assert.equal(stats.isTruncated, false);
});
