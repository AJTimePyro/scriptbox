import type { RunOptions, RunResult } from "./types/index.js";
import { PythonRunner } from "./runner/python.js";
import { UnsupportedLanguage } from "./errors/runner.js";

export class ScriptBox {
  public async run(options: RunOptions): Promise<RunResult> {
    switch (options.language) {
      case "python": {
        const pyrunner = new PythonRunner();

        await pyrunner.load_library();
        return await pyrunner.run(options.code);
      }
      default:
        throw new UnsupportedLanguage(options.language);
    }
  }
}
