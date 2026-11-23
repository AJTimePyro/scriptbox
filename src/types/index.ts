export interface RunOptions {
  language: string;
  code: string;
  timeout?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  /** Exit status reported by the C++ runner. Python and R leave it unset. */
  exitCode?: number;
}
