import type { RunOptions, RunResult } from "./types/index.js";
import type { BaseRunner } from "./runner/base.js";
import { PythonRunner } from "./runner/python.js";
import { RRunner } from "./runner/r.js";
import { CppRunner } from "./runner/cpp.js";
import { UnsupportedLanguage } from "./errors/runner.js";

export interface LanguageInfo {
  id: string;
  label: string;
  template: string;
}

interface LanguageEntry extends LanguageInfo {
  createRunner: () => BaseRunner;
}

const LANGUAGES: Record<string, LanguageEntry> = {
  python: {
    id: "python",
    label: "Python",
    template: `print("Hello from ScriptBox (Python)")`,
    createRunner: () => new PythonRunner(),
  },
  r: {
    id: "r",
    label: "R",
    template: `cat("Hello from ScriptBox (R)\\n")`,
    createRunner: () => new RRunner(),
  },
  cpp: {
    id: "cpp",
    label: "C++",
    template: `#include <iostream>

int main() {
  std::cout << "Hello from ScriptBox (C++)" << std::endl;
  return 0;
}`,
    createRunner: () => new CppRunner(),
  },
};

export class ScriptBox {
  private runners = new Map<string, BaseRunner>();

  getLanguages(): LanguageInfo[] {
    return Object.values(LANGUAGES).map(({ id, label, template }) => ({
      id,
      label,
      template,
    }));
  }

  public async run(options: RunOptions): Promise<RunResult> {
    const entry = Object.hasOwn(LANGUAGES, options.language)
      ? LANGUAGES[options.language]
      : undefined;
    if (!entry) {
      throw new UnsupportedLanguage(options.language);
    }

    let runner = this.runners.get(options.language);
    if (!runner) {
      runner = entry.createRunner();
      this.runners.set(options.language, runner);
    }

    await runner.load_library();
    return await runner.run(options.code, options);
  }
}
