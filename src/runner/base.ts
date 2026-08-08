import type { RunResult } from "../types.js";

export abstract class BaseRunner {
  abstract load_library(): Promise<void>;
  abstract run(code: string): Promise<RunResult>;
}
