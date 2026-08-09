export interface RunOptions {
  language: "python";
  code: string;
  timeout?: number;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  executionTime: number;
}
