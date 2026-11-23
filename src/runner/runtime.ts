export function isNodeRuntime(): boolean {
  const proc = (globalThis as {
    process?: { versions?: { node?: string } };
  }).process;
  return typeof proc?.versions?.node === "string";
}
