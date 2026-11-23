export interface RunOptions {
  language: string;
  code: string;
  timeout?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  /** Exit status set by the C++, JavaScript, TypeScript, and Go runners. Python and R leave it unset. */
  exitCode?: number;
}
