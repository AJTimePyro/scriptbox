import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";

const CDN = "https://cdn.jsdelivr.net/npm";
const PHP_WASM_VERSION = "3.1.66";
// PHP 8.3 is ~0.7 MB smaller on first load; 8.4 is used here because it was verified end to end.
const PHP_VERSION = "8.4";

interface StreamedPHPResponse {
  stdoutText: Promise<string>;
  stderrText: Promise<string>;
  exitCode: Promise<number>;
}

interface PHPInstance {
  runStream(options: { code: string }): Promise<StreamedPHPResponse>;
}

type PHPConstructor = new (runtimeId: number) => PHPInstance;

export class PhpRunner extends BaseRunner {
  private php: PHPInstance | null = null;
  private loading: Promise<void> | null = null;

  async load_library(): Promise<void> {
    if (this.php) return;
    if (!this.loading) {
      this.loading = this.doLoad().catch((error: unknown) => {
        this.loading = null;
        throw error;
      });
    }
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    const [{ PHP }, { loadWebRuntime }] = await Promise.all([
      import(
        /* @vite-ignore */ `${CDN}/@php-wasm/universal@${PHP_WASM_VERSION}/+esm`
      ) as Promise<{ PHP: PHPConstructor }>,
      import(
        /* @vite-ignore */ `${CDN}/@php-wasm/web@${PHP_WASM_VERSION}/+esm`
      ) as Promise<{ loadWebRuntime: (version: string) => Promise<number> }>,
    ]);

    this.php = new PHP(await loadWebRuntime(PHP_VERSION));
  }

  async run(code: string, _options?: RunOptions): Promise<RunResult> {
    if (!this.php) throw new LibraryNotLoadedError();

    const start = performance.now();
    // A real PHP tag anywhere opens the code; `<?xml` inside a string does not.
    const source = /<\?(php|=)/.test(code) ? code : `<?php\n${code}`;
    const response = await this.php.runStream({ code: source });
    const stdout = await response.stdoutText;
    const stderr = await response.stderrText;
    const exitCode = await response.exitCode;

    return {
      stdout,
      stderr,
      executionTime: performance.now() - start,
      exitCode,
    };
  }
}
