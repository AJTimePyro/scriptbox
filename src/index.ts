import type { RunOptions, RunResult } from "./types/index.js";
import { PythonRunner } from "./runner/python.js";
import { UnsupportedLanguage } from "./errors/runner.js";

export class ScriptBox {
  private pythonRunner: PythonRunner | null = null;

  public async run(options: RunOptions): Promise<RunResult> {
    switch (options.language) {
      case "python": {
        if (!this.pythonRunner) {
          this.pythonRunner = new PythonRunner();
        }

        await this.pythonRunner.load_library();
        return await this.pythonRunner.run(options.code);
      }
      default:
        throw new UnsupportedLanguage(options.language);
    }
  }
}
