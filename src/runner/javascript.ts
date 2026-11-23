import { BaseRunner } from "./base.js";
import type { RunOptions, RunResult } from "../types/index.js";

type AsyncFunctionConstructor = new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;

function format(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

// User code has the host's full rights: file system, network, and process. Run trusted code only,
// or run this inside an isolated worker.
export class JavaScriptRunner extends BaseRunner {
  async load_library(): Promise<void> {}

  async run(code: string, _options?: RunOptions): Promise<RunResult> {
    // shortcut: RunOptions.timeout is ignored; stop a stuck run by terminating the worker.
    // shortcut: setInterval is not tracked; terminate the worker to stop it.
    const stdout: string[] = [];
    const stderr: string[] = [];
    const write = (target: string[], args: unknown[]) => {
      target.push(args.map(format).join(" "));
    };
    const consoleShim = new Proxy({} as Record<string, (...args: unknown[]) => void>, {
      get: (_target, method) => (...args: unknown[]) =>
        write(method === "warn" || method === "error" ? stderr : stdout, args),
    });

    const pending: Promise<void>[] = [];
    const pendingTimers = new Map<ReturnType<typeof setTimeout>, () => void>();
    const setTimeoutShim = ((
      callback: (...args: unknown[]) => void,
      delay?: number,
      ...args: unknown[]
    ) => {
      let finish!: () => void;
      const done = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const id = globalThis.setTimeout(() => {
        try {
          callback(...args);
        } catch (error) {
          write(stderr, [error]);
        } finally {
          pendingTimers.delete(id);
          finish();
        }
      }, delay);
      pending.push(done);
      pendingTimers.set(id, finish);
      return id;
    }) as typeof setTimeout;

    const clearTimeoutShim = ((id: ReturnType<typeof setTimeout> | undefined) => {
      if (id === undefined) return;
      globalThis.clearTimeout(id);
      const finish = pendingTimers.get(id);
      if (finish) {
        pendingTimers.delete(id);
        finish();
      }
    }) as typeof clearTimeout;

    const startTime = performance.now();
    try {
      const fn = new AsyncFunction("console", "setTimeout", "clearTimeout", "exports", code);
      await fn(consoleShim, setTimeoutShim, clearTimeoutShim, {});
      while (pending.length > 0) {
        await Promise.all(pending.splice(0));
      }
    } catch (error) {
      return {
        stdout: stdout.join("\n"),
        stderr: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
        exitCode: 1,
      };
    }

    return {
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
      executionTime: performance.now() - startTime,
    };
  }
}
