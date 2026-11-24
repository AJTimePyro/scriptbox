import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";

const CDN = "https://cdn.jsdelivr.net/npm";
const RUBY_VERSION = "2.10.1";
const RUBY_WASM_URL = `${CDN}/@ruby/3.4-wasm-wasi@${RUBY_VERSION}/dist/ruby%2Bstdlib.wasm`;

interface Printer {
  addToImports(imports: WebAssembly.Imports): void;
  setMemory(memory: WebAssembly.Memory): void;
}

interface RubyVMInstance {
  addToImports(imports: WebAssembly.Imports): void;
  setInstance(instance: WebAssembly.Instance): Promise<void>;
  initialize(): void;
  eval(code: string): unknown;
}

type RubyVMConstructor = new () => RubyVMInstance;

interface WASIInstance {
  wasiImport: WebAssembly.ModuleImports;
  initialize(instance: WebAssembly.Instance): void;
}

type WASIConstructor = new (
  args: string[],
  env: string[],
  fds: unknown[],
  options: unknown,
) => WASIInstance;

interface WASIShim {
  WASI: WASIConstructor;
  File: new (data: Uint8Array) => unknown;
  OpenFile: new (file: unknown) => unknown;
  PreopenDirectory: new (path: string, entries: Map<string, unknown>) => unknown;
}

interface RubyAPI {
  RubyVM: RubyVMConstructor;
  consolePrinter(callbacks: {
    stdout: (text: string) => void;
    stderr: (text: string) => void;
  }): Printer;
}

export class RubyRunner extends BaseRunner {
  private module: WebAssembly.Module | null = null;
  private api: RubyAPI | null = null;
  private shim: WASIShim | null = null;
  private loading: Promise<void> | null = null;

  async load_library(): Promise<void> {
    if (this.module) return;
    if (!this.loading) {
      this.loading = this.doLoad().catch((error: unknown) => {
        this.loading = null;
        throw error;
      });
    }
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    const [api, shim] = await Promise.all([
      import(
        /* @vite-ignore */ `${CDN}/@ruby/wasm-wasi@${RUBY_VERSION}/+esm`
      ) as Promise<RubyAPI>,
      import(
        /* @vite-ignore */ `${CDN}/@bjorn3/browser_wasi_shim@0.4.2/+esm`
      ) as Promise<WASIShim>,
    ]);

    const response = await fetch(RUBY_WASM_URL);
    if (!response.ok) {
      throw new Error(`Failed to load Ruby runtime from ${RUBY_WASM_URL}: ${response.status}`);
    }

    this.module = await WebAssembly.compile(await response.arrayBuffer());
    this.api = api;
    this.shim = shim;
  }

  async run(code: string, _options?: RunOptions): Promise<RunResult> {
    if (!this.module || !this.api || !this.shim) {
      throw new LibraryNotLoadedError();
    }

    const stdout: string[] = [];
    const stderr: string[] = [];
    const start = performance.now();

    const { WASI, File, OpenFile, PreopenDirectory } = this.shim;
    const emptyFile = () => new OpenFile(new File(new Uint8Array(0)));
    const wasi = new WASI(
      [],
      [],
      [emptyFile(), emptyFile(), emptyFile(), new PreopenDirectory("/", new Map())],
      { debug: false },
    );

    const printer = this.api.consolePrinter({
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });
    const imports: WebAssembly.Imports = {
      wasi_snapshot_preview1: wasi.wasiImport,
    };
    printer.addToImports(imports);

    // A fresh VM per run keeps constants and globals from leaking between runs.
    const vm = new this.api.RubyVM();
    vm.addToImports(imports);
    const instance = await WebAssembly.instantiate(this.module, imports);
    printer.setMemory(instance.exports.memory as WebAssembly.Memory);
    await vm.setInstance(instance);
    wasi.initialize(instance);
    vm.initialize();

    let exitCode = 0;
    try {
      vm.eval(code);
    } catch (error) {
      stderr.push(error instanceof Error ? error.message : String(error));
      exitCode = 1;
    }

    return {
      stdout: stdout.join(""),
      stderr: stderr.join(""),
      executionTime: performance.now() - start,
      exitCode,
    };
  }
}
