import type { PyodideInterface } from "pyodide";

import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunResult } from "../types.js";

// Always fetches latest stable library
const PYODIDE_CDN_BASE = "https://cdn.jsdelivr.net/npm/pyodide@0/";
const PYODIDE_MODULE = `${PYODIDE_CDN_BASE}pyodide.mjs`;

export class PythonRunner extends BaseRunner {
  private pyodide: PyodideInterface | null = null;

  async load_library() {
    if (this.pyodide) return;

    const { loadPyodide } = await import(PYODIDE_MODULE);
    this.pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN_BASE,
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
