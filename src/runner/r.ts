import type { WebR as WebRType, Shelter } from "webr";
import { LibraryNotLoadedError } from "../errors/runner.js";
import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";
import type { RRunnerOptions } from "../types/runner.js";


const WEBR_CDN_BASE = "https://webr.r-wasm.org";
const WEBR_MODULE_FILE = "webr.mjs";


export class RRunner extends BaseRunner {
  private webR: WebRType | null = null;
  private shelter: Shelter | null = null;
  private webRVersion: string = "0.6.0";

  constructor(options: RRunnerOptions = {}) {
    super();
    if (options.webRVersion) {
      this.webRVersion = options.webRVersion;
    }
  }

  /**
   * Dynamically fetches and initializes the WebR WebAssembly runtime from CDN.
   *
   * Note: Dynamic URL imports may trigger bundler analysis warnings in dev mode (e.g. Vite).
   */
  async load_library() {
    if (this.webR) return;

    const webRBaseWithVer = `${WEBR_CDN_BASE}/v${this.webRVersion}`;
    const { WebR } = await import(
      /* @vite-ignore */ `${webRBaseWithVer}/${WEBR_MODULE_FILE}`
    );

    const webR = new WebR({ baseUrl: `${webRBaseWithVer}/` });
    await webR.init();
    this.webR = webR;
    this.shelter = await new webR.Shelter();
  }

  async run(code: string, _options?: RunOptions): Promise<RunResult> {
    if (!this.webR || !this.shelter) {
      throw new LibraryNotLoadedError();
    }

    const startTime = performance.now();
    try {
      const result = await this.shelter.captureR(code);

      const localStdoutBuffer: string[] = [];
      const localStderrBuffer: string[] = [];

      for (const message of result.output) {
        if (message.type === "stdout" && typeof message.data === "string") {
          localStdoutBuffer.push(message.data);
        } else if (message.type === "stderr" || message.type === "error") {
          localStderrBuffer.push(String(message.data));
        }
      }

      const executionTime = performance.now() - startTime;

      return {
        stdout: localStdoutBuffer.join("\n"),
        stderr: localStderrBuffer.join("\n"),
        executionTime,
      };
    } finally {
      this.shelter.purge();
    }
  }
}
