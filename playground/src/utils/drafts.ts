export const STORAGE_KEY = "scriptbox_code_v2";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike {
  try {
    return localStorage;
  } catch {
    // Storage can be blocked by browser settings or an embedding frame.
    return { getItem: () => null, setItem: () => {} };
  }
}

/** Read every stored draft, dropping anything that is not a string. */
export function readDrafts(storage: StorageLike = defaultStorage()): Record<string, string> {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

/** Merge saved drafts over starter snippets, resetting the obsolete cpp <numeric> snippet. */
export function loadDrafts(
  defaults: Record<string, string>,
  storage: StorageLike = defaultStorage(),
): Record<string, string> {
  const saved = readDrafts(storage);
  if (saved.cpp && saved.cpp.includes("<numeric>")) {
    saved.cpp = defaults.cpp;
  }
  return { ...defaults, ...saved };
}

/**
 * Persist one language draft, keeping drafts of other languages written by other tabs.
 * shortcut: two tabs editing the same language is last-write-wins; only then can edits be lost.
 */
export function saveDraft(
  id: string,
  code: string,
  storage: StorageLike = defaultStorage(),
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...readDrafts(storage), [id]: code }));
  } catch {
    // Quota exceeded or storage blocked: keep editing without persistence.
  }
}
