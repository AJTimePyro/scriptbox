import type { RunOptions, RunResult } from "../types/index.js";

export abstract class BaseRunner {
  abstract load_library(): Promise<void>;
  abstract run(code: string, options?: RunOptions): Promise<RunResult>;
}
