export type RunStatus = "idle" | "loading" | "running" | "done" | "error";

export type RuntimeState = "unloaded" | "loading" | "ready" | "failed";

export type LanguageRuntimeInfo = {
  id: string;
  label: string;
  filename: string;
  engineName: string;
  version: string;
  state: RuntimeState;
  loadMs: number | null;
  transferBytes: number | null;
  isFromCache?: boolean;
  error?: string;
};

export type RunMetrics = {
  packageLoadMs: number | null;
  compileMs: number | null; // null = unsupported/unreported, render placeholder
  runMs: number | null;
  totalMs: number | null;
  transferBytes?: number | null;
  isFromCache?: boolean;
  cached?: boolean;
};

export type OutputFilter = "all" | "stdout" | "stderr";

export type CursorPosition = {
  line: number;
  col: number;
};

export type RunOutput = {
  stdout: string;
  stderr: string;
  executionTime: number | null;
  exitCode?: number;
};

export type EngineRunReport = {
  output: RunOutput;
  loadMs: number | null;
  transferBytes: number | null;
  isFromCache: boolean;
  loadedNow: boolean;
};

export type EngineWorkerRequest = {
  id: number;
  language: string;
  code: string;
};

export type EngineWorkerResponse =
  | { id: number; report: EngineRunReport }
  | { id: number; error: string };

