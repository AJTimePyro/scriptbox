import { LibraryNotLoadedError } from "../errors/runner.js";
import type { RunOptions, RunResult } from "../types/index.js";
import { BaseRunner } from "./base.js";
import { JavaScriptRunner } from "./javascript.js";
import { isNodeRuntime } from "./runtime.js";

const TYPESCRIPT_VERSION = "6.0.3";
const TYPESCRIPT_CDN_BASE = "https://cdn.jsdelivr.net/npm/typescript";
const TYPESCRIPT_MODULE_FILE = "lib/typescript.js/+esm";

type TypeScriptModule = typeof import("typescript");

// The function call hides the specifier from bundlers. Node resolves "typescript" from node_modules;
// browsers fetch the compiler from the CDN.
function typescriptPackageName(): string {
  return "typescript";
}

export class TypeScriptRunner extends BaseRunner {
  private ts: TypeScriptModule | null = null;
  private readonly jsRunner = new JavaScriptRunner();

  async load_library(): Promise<void> {
    if (this.ts) return;

    this.ts = isNodeRuntime()
      ? ((await import(/* @vite-ignore */ typescriptPackageName())) as TypeScriptModule)
      : ((await import(
          /* @vite-ignore */ `${TYPESCRIPT_CDN_BASE}@${TYPESCRIPT_VERSION}/${TYPESCRIPT_MODULE_FILE}`
        )) as TypeScriptModule);
  }

  async run(code: string, options?: RunOptions): Promise<RunResult> {
    if (!this.ts) {
      throw new LibraryNotLoadedError();
    }

    const startTime = performance.now();
    const compiler = this.ts;
    const compiled = compiler.transpileModule(code, {
      fileName: "main.ts",
      reportDiagnostics: true,
      compilerOptions: {
        target: compiler.ScriptTarget.ES2022,
        // Emit CommonJS so the JS runner can execute code that uses `export`.
        module: compiler.ModuleKind.CommonJS,
      },
    });

    const diagnostics = compiled.diagnostics ?? [];
    if (diagnostics.length > 0) {
      return {
        stdout: "",
        stderr: diagnostics
          .map((diagnostic) => {
            const message = compiler.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (!diagnostic.file || diagnostic.start === undefined) return message;
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
              diagnostic.start,
            );
            return `line ${line + 1}, col ${character + 1}: ${message}`;
          })
          .join("\n"),
        executionTime: performance.now() - startTime,
        exitCode: 1,
      };
    }

    const result = await this.jsRunner.run(compiled.outputText, options);
    return { ...result, executionTime: performance.now() - startTime };
  }
}
