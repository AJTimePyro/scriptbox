import type { PyodideInterface } from "pyodide";

import { LibraryNotLoadedError } from "../errors/runner";
import { BaseRunner } from "./base";


// Always fetches latest stable library
const PYODIDE_MODULE = "https://cdn.jsdelivr.net/npm/pyodide@0/pyodide.js";


export class PythonRunner extends BaseRunner {
  private pyodide: PyodideInterface | null = null;

  async load_library() {
    if (this.pyodide) return;

    const { loadPyodide } = await import(PYODIDE_MODULE);
    this.pyodide = await loadPyodide();
  }

  async run(code: string) {
    if (!this.pyodide) {
      throw new LibraryNotLoadedError();
    }

    await this.pyodide.runPythonAsync(code);
  }
}
