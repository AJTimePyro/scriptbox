import type { RunOptions, RunResult } from "./types/index.js";
import type { GoRunnerOptions } from "./types/runner.js";
import type { BaseRunner } from "./runner/base.js";
import { PythonRunner } from "./runner/python.js";
import { RRunner } from "./runner/r.js";
import { CppRunner } from "./runner/cpp.js";
import { JavaScriptRunner } from "./runner/javascript.js";
import { TypeScriptRunner } from "./runner/typescript.js";
import { GoRunner } from "./runner/go.js";
import { PhpRunner } from "./runner/php.js";
import { RubyRunner } from "./runner/ruby.js";
import { UnsupportedLanguage } from "./errors/runner.js";

export interface LanguageInfo {
  id: string;
  label: string;
  template: string;
}

interface LanguageEntry extends LanguageInfo {
  createRunner: (goOptions?: GoRunnerOptions) => BaseRunner;
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
  javascript: {
    id: "javascript",
    label: "JavaScript",
    template: `console.log("Hello from ScriptBox (JavaScript)")`,
    createRunner: () => new JavaScriptRunner(),
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    template: `const message: string = "Hello from ScriptBox (TypeScript)";
console.log(message)`,
    createRunner: () => new TypeScriptRunner(),
  },
  go: {
    id: "go",
    label: "Go",
    template: `package main

import "fmt"

func main() {
	fmt.Println("Hello from ScriptBox (Go)")
}`,
    createRunner: (goOptions) => new GoRunner(goOptions),
  },
  php: {
    id: "php",
    label: "PHP",
    template: `<?php
echo "Hello from ScriptBox (PHP)\\n";`,
    createRunner: () => new PhpRunner(),
  },
  ruby: {
    id: "ruby",
    label: "Ruby",
    template: `puts "Hello from ScriptBox (Ruby)"`,
    createRunner: () => new RubyRunner(),
  },
};

export interface ScriptBoxOptions {
  /** Override the Go WASM URLs to use a self-hosted build. */
  go?: GoRunnerOptions;
}

export class ScriptBox {
  private runners = new Map<string, BaseRunner>();

  constructor(private readonly options: ScriptBoxOptions = {}) {}

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
      runner = entry.createRunner(this.options.go);
      this.runners.set(options.language, runner);
    }

    await runner.load_library();
    return await runner.run(options.code, options);
  }
}
