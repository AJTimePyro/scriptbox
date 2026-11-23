import type {
  CppBoltCompiler,
  RunOptions as CppBoltRunOptions,
  RunResult as CppBoltRunResult,
} from "cppbolt";

import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";
import type { CppRunnerOptions } from "../types/runner.js";

const CPPBOLT_CDN_BASE = "https://cdn.jsdelivr.net/npm/cppbolt";
const CPPBOLT_BROWSER_FILE = "dist/index.browser.mjs";
const CPPBOLT_WASM_FILE = "wasm/cppbolt.wasm";

type CppBoltModule = typeof import("cppbolt");

function isNodeRuntime(): boolean {
  const proc = (globalThis as {
    process?: { versions?: { node?: string } };
  }).process;
  return typeof proc?.versions?.node === "string";
}

export class CppRunner extends BaseRunner {
  private cppbolt: CppBoltModule | null = null;
  private compiler: CppBoltCompiler | null = null;
  private cppboltVersion: string = "1.1.0";

  constructor(options: CppRunnerOptions = {}) {
    super();

    if (options.cppboltVersion) {
      this.cppboltVersion = options.cppboltVersion;
    }
  }

  async load_library() {
    if (this.compiler) return;

    const cppbolt = await this.load_cppbolt();
    this.cppbolt = cppbolt;
    this.compiler = isNodeRuntime()
      ? await cppbolt.createCompiler()
      : await cppbolt.createCompiler(
          this.get_cppbolt_url(CPPBOLT_WASM_FILE),
        );
  }

  async run(code: string, options?: RunOptions): Promise<RunResult> {
    if (!this.cppbolt || !this.compiler) {
      throw new LibraryNotLoadedError();
    }

    const startTime = performance.now();
    const runOptions: CppBoltRunOptions = {};

    if (options?.timeout !== undefined) {
      runOptions.timeoutMs = options.timeout;
    }

    try {
      const result: CppBoltRunResult = await this.cppbolt.compileAndRunAsync(
        this.compiler,
        code,
        runOptions,
      );

      return {
        stdout: result.stdout,
        stderr:
          result.exitCode === 0
            ? ""
            : `Process exited with code ${result.exitCode}`,
        executionTime: performance.now() - startTime,
        exitCode: result.exitCode,
      };
    } catch (error) {
      if (error instanceof this.cppbolt.CompileError) {
        return {
          stdout: "",
          stderr: error.diagnostic,
          executionTime: performance.now() - startTime,
          exitCode: 1,
        };
      }

      if (error instanceof this.cppbolt.TimeoutError) {
        return {
          stdout: error.stdout ?? "",
          stderr: error.message,
          executionTime: performance.now() - startTime,
          exitCode: 124,
        };
      }

      throw error;
    }
  }

  private async load_cppbolt(): Promise<CppBoltModule> {
    if (isNodeRuntime()) {
      return (await import("cppbolt")) as CppBoltModule;
    }

    return (await import(
      /* @vite-ignore */ this.get_cppbolt_url(CPPBOLT_BROWSER_FILE)
    )) as CppBoltModule;
  }

  private get_cppbolt_url(file: string): string {
    return `${CPPBOLT_CDN_BASE}@${this.cppboltVersion}/${file}`;
  }
}
