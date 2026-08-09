import type { PyodideInterface } from "pyodide";

import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunResult } from "../types/index.js";
import type { PythonRunnerOptions } from "../types/runner.js";

// Always fetches latest stable library
const PYODIDE_CDN_BASE = "https://cdn.jsdelivr.net/npm/pyodide";
const PYODIDE_MODULE_FILE = "pyodide.mjs";

export class PythonRunner extends BaseRunner {
  private pyodide: PyodideInterface | null = null;
  private pyodideVersion: string = "0";

  constructor(options: PythonRunnerOptions = {}) {
    super();

    if (options.pyodideVersion) {
      this.pyodideVersion = options.pyodideVersion;
    }
  }

  /**
   * Dynamically fetches and initializes the Pyodide WebAssembly runtime from CDN.
   * * Note: Dynamic URL imports may trigger bundler analysis warnings in dev mode (e.g. Vite).
   */
  async load_library() {
    if (this.pyodide) return;

    const pyodideBaseWithVer = `${PYODIDE_CDN_BASE}@${this.pyodideVersion}`;
    const { loadPyodide } = await import(
      `${pyodideBaseWithVer}/${PYODIDE_MODULE_FILE}`
    );
    this.pyodide = await loadPyodide({
      indexURL: pyodideBaseWithVer,
    });
  }

  async run(code: string): Promise<RunResult> {
    if (!this.pyodide) {
      throw new LibraryNotLoadedError();
    }

    const localStdoutBuffer: string[] = [];
    const localStderrBuffer: string[] = [];

    this.pyodide.setStdout({
      batched: (output: string) => {
        localStdoutBuffer.push(output);
      },
    });

    this.pyodide.setStderr({
      batched: (output: string) => {
        localStderrBuffer.push(output);
      },
    });

    const startTime = performance.now();
    try {
      await this.pyodide.runPythonAsync(code);
      const executionTime = performance.now() - startTime;

      return {
        stdout: localStdoutBuffer.join("\n"),
        stderr: localStderrBuffer.join("\n"),
        executionTime,
      };
    } finally {
      this.pyodide.setStdout({ batched: () => {} });
      this.pyodide.setStderr({ batched: () => {} });
    }
  }
}
