export interface RunOptions {
  language: string;
  code: string;
  timeout?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  /** Exit status set by C++, Go, PHP, Ruby, JavaScript, and TypeScript. Python and R leave it unset. */
  exitCode?: number;
}
