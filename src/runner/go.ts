import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";
import type { GoRunnerOptions } from "../types/runner.js";

// Defaults to the hosted yaegi interpreter (GOOS=js); both URLs can be overridden.
const YAEGI_WASM_VERSION = "1.0.2";
const DEFAULT_WASM_URL = `https://cdn.jsdelivr.net/npm/yaegi-wasm@${YAEGI_WASM_VERSION}/src/yaegi-browser.wasm`;
const DEFAULT_EXEC_URL = `https://cdn.jsdelivr.net/npm/yaegi-wasm@${YAEGI_WASM_VERSION}/src/wasm_exec.js`;

interface HostedYaegi {
  eval(source: string): { success?: boolean; output?: string; error?: string | null };
  reset(): unknown;
}

interface SelfHostedResult {
  success?: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
}

interface YaegiGlobals {
  Go?: new () => {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<unknown>;
  };
  fs?: { writeSync(fd: number, buf: Uint8Array): number };
  yaegi?: HostedYaegi;
  yaegiEval?: (source: string) => SelfHostedResult;
}

interface Runtime {
  run(source: string): { stdout: string; stderr: string; success: boolean };
}

interface Capture {
  stdout: string[];
  stderr: string[];
}

interface RuntimeSnapshot {
  hosted: HostedYaegi | undefined;
  selfHosted: ((source: string) => SelfHostedResult) | undefined;
}

// Go writes stdout and stderr through globalThis.fs, so the capture buffers are module-wide.
const capture: Capture = { stdout: [], stderr: [] };
let captureInstalled = false;
let runtimeQueue: Promise<unknown> = Promise.resolve();

function globals(): YaegiGlobals {
  return globalThis as unknown as YaegiGlobals;
}

function installCapture(): void {
  if (captureInstalled) return;
  const fs = globals().fs;
  if (!fs) return;
  const decoder = new TextDecoder();
  const original = fs.writeSync.bind(fs);
  fs.writeSync = (fd, buf) => {
    if (fd === 1) {
      capture.stdout.push(decoder.decode(buf));
      return buf.length;
    }
    if (fd === 2) {
      capture.stderr.push(decoder.decode(buf));
      return buf.length;
    }
    return original(fd, buf);
  };
  captureInstalled = true;
}

// Bind to the global this load replaced, not one left by another instance.
function detectRuntime(before: RuntimeSnapshot): Runtime | null {
  const g = globals();

  if (g.yaegiEval && g.yaegiEval !== before.selfHosted) {
    const yaegiEval = g.yaegiEval;
    return {
      run(source) {
        const r = yaegiEval(source);
        return {
          stdout: r.stdout ?? "",
          stderr: r.stderr || r.error || "",
          success: r.success === true,
        };
      },
    };
  }

  if (g.yaegi && g.yaegi !== before.hosted && typeof g.yaegi.eval === "function") {
    const yaegi = g.yaegi;
    return {
      run(source) {
        yaegi.reset();
        const r = yaegi.eval(source);
        return {
          stdout: capture.stdout.join("") || r.output || "",
          stderr: capture.stderr.join("") || r.error || "",
          success: r.success === true,
        };
      },
    };
  }

  return null;
}

export class GoRunner extends BaseRunner {
  private runtime: Runtime | null = null;
  private loading: Promise<void> | null = null;
  private readonly wasmUrl: string;
  private readonly execUrl: string;

  constructor(options: GoRunnerOptions = {}) {
    super();
    this.wasmUrl = options.wasmUrl ?? DEFAULT_WASM_URL;
    this.execUrl = options.execUrl ?? DEFAULT_EXEC_URL;
  }

  async load_library(): Promise<void> {
    if (this.runtime) return;
    if (!this.loading) {
      this.loading = this.doLoad().catch((error: unknown) => {
        this.loading = null;
        throw error;
      });
    }
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    const [execResponse, wasmResponse] = await Promise.all([
      fetch(this.execUrl),
      fetch(this.wasmUrl),
    ]);
    for (const [response, url] of [
      [execResponse, this.execUrl],
      [wasmResponse, this.wasmUrl],
    ] as const) {
      if (!response.ok) {
        throw new Error(`Failed to load Go runtime from ${url}: ${response.status}`);
      }
    }

    // wasm_exec.js is a classic script that assigns globalThis.Go.
    if (!globals().Go) {
      new Function(await execResponse.text())();
    }
    const GoCtor = globals().Go;
    if (!GoCtor) throw new Error("Go wasm_exec.js did not define Go");
    const go = new GoCtor();
    const bytes = await wasmResponse.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, go.importObject);

    const g = globals();
    const before: RuntimeSnapshot = {
      hosted: g.yaegi,
      selfHosted: g.yaegiEval,
    };
    installCapture();

    let bootError: unknown;
    const running = go.run(instance);
    running.catch((error: unknown) => {
      bootError = error;
    });

    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (bootError) throw bootError;
      this.runtime = detectRuntime(before);
      if (this.runtime) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error("Go WASM runtime did not register its eval function");
  }

  async run(code: string, _options?: RunOptions): Promise<RunResult> {
    // shortcut: RunOptions.timeout is ignored; stop a stuck run by terminating the worker.
    if (!this.runtime) throw new LibraryNotLoadedError();

    // Shared globals and capture buffers: serialize evaluations.
    const task = runtimeQueue.then(() => {
      capture.stdout.length = 0;
      capture.stderr.length = 0;
      const start = performance.now();
      try {
        const r = this.runtime!.run(code);
        return {
          stdout: r.stdout,
          stderr: r.stderr,
          executionTime: performance.now() - start,
          exitCode: r.success ? 0 : 1,
        };
      } catch (error) {
        return {
          stdout: capture.stdout.join(""),
          stderr: error instanceof Error ? error.message : String(error),
          executionTime: performance.now() - start,
          exitCode: 1,
        };
      }
    });
    runtimeQueue = task.catch(() => {});
    return task;
  }
}
