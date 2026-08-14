import type { RunOptions, RunResult } from "./types/index.js";
import { PythonRunner } from "./runner/python.js";
import { RRunner } from "./runner/r.js";
import { UnsupportedLanguage } from "./errors/runner.js";

export class ScriptBox {
  private pythonRunner: PythonRunner | null = null;
  private rRunner: RRunner | null = null;

  public async run(options: RunOptions): Promise<RunResult> {
    switch (options.language) {
      case "python": {
        if (!this.pythonRunner) {
          this.pythonRunner = new PythonRunner();
        }

        await this.pythonRunner.load_library();
        return await this.pythonRunner.run(options.code);
      }
      case "r": {
        if (!this.rRunner) {
          this.rRunner = new RRunner();
        }

        await this.rRunner.load_library();
        return await this.rRunner.run(options.code);
      }
      default:
        throw new UnsupportedLanguage(options.language);
    }
  }
}
