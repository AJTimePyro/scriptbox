import EngineWorker from "../workers/engine.worker?worker";
import type { EngineRunReport, EngineWorkerRequest, EngineWorkerResponse } from "../types";

export type EngineClient = {
  run: (code: string) => Promise<EngineRunReport>;
  stop: () => void;
};

/**
 * One engine worker per language. Stopping terminates the worker, which is the only way
 * to interrupt a WASM program that never yields; the next run loads the runtime again.
 */
export function createEngineClient(language: string): EngineClient {
  let worker: Worker | null = null;
  let pending: {
    id: number;
    resolve: (report: EngineRunReport) => void;
    reject: (error: Error) => void;
  } | null = null;
  let nextId = 0;

  const settleError = (error: Error) => {
    const current = pending;
    pending = null;
    current?.reject(error);
  };

  const ensureWorker = (): Worker => {
    if (worker) return worker;
    const created = new EngineWorker();

    created.onmessage = (event: MessageEvent<EngineWorkerResponse>) => {
      if (!pending || event.data.id !== pending.id) return;
      const current = pending;
      pending = null;
      if ("error" in event.data) current.reject(new Error(event.data.error));
      else current.resolve(event.data.report);
    };

    created.onerror = (event) => {
      created.terminate();
      if (worker === created) worker = null;
      settleError(new Error(event.message || "Engine worker crashed"));
    };

    created.onmessageerror = () => settleError(new Error("Engine worker sent an unreadable message"));

    worker = created;
    return created;
  };

  return {
    run(code) {
      if (pending) return Promise.reject(new Error("A run is already in progress"));
      const active = ensureWorker();
      const id = ++nextId;
      return new Promise<EngineRunReport>((resolve, reject) => {
        pending = { id, resolve, reject };
        const request: EngineWorkerRequest = { id, language, code };
        active.postMessage(request);
      });
    },
    stop() {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      settleError(new Error("Run stopped"));
    },
  };
}
