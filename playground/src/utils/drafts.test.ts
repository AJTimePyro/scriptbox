import assert from "node:assert/strict";
import test from "node:test";
import { loadDrafts, readDrafts, saveDraft, STORAGE_KEY } from "./drafts.ts";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function fakeStorage(initial?: string): StorageLike & { dump: () => unknown } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    dump: () => JSON.parse(data.get(STORAGE_KEY) ?? "{}") as unknown,
  };
}

const defaults = { python: "print(1)", r: "# r", cpp: "int main(){}" };

test("stored drafts win over starter snippets", () => {
  const storage = fakeStorage(JSON.stringify({ python: "print(2)" }));
  assert.deepEqual(loadDrafts(defaults, storage), { ...defaults, python: "print(2)" });
});

test("broken JSON falls back to the starter snippets", () => {
  assert.deepEqual(loadDrafts(defaults, fakeStorage("{not json")), defaults);
});

test("non-string values are ignored instead of crashing the editor", () => {
  const storage = fakeStorage(JSON.stringify({ python: 5, r: "cat('x')" }));
  assert.deepEqual(readDrafts(storage), { r: "cat('x')" });
});

test("the obsolete cpp snippet with <numeric> is reset", () => {
  const storage = fakeStorage(JSON.stringify({ cpp: "#include <numeric>" }));
  assert.equal(loadDrafts(defaults, storage).cpp, defaults.cpp);
});

test("saving one draft keeps drafts written by other tabs", () => {
  const storage = fakeStorage(JSON.stringify({ r: "cat('other tab')" }));
  saveDraft("python", "print(3)", storage);
  assert.deepEqual(storage.dump(), { r: "cat('other tab')", python: "print(3)" });
});

test("blocked localStorage does not stop the editor from loading", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("storage blocked");
    },
  });
  try {
    assert.deepEqual(readDrafts(), {});
    assert.deepEqual(loadDrafts(defaults), defaults);
    assert.doesNotThrow(() => saveDraft("python", "print(4)"));
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
