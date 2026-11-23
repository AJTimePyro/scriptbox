import { ScriptBox } from "scriptbox";
import { measureResourceTransfer } from "../utils/timing";
import type {
  EngineRunReport,
  EngineWorkerRequest,
  EngineWorkerResponse,
} from "../types";

// Minimal typed view of the worker global, so this file compiles with the DOM lib.
type WorkerScope = {
  onmessage: ((event: MessageEvent<EngineWorkerRequest>) => void) | null;
  postMessage: (message: EngineWorkerResponse) => void;
};

const scope = self as unknown as WorkerScope;
const box = new ScriptBox();

// Load metrics for this worker's runtime, measured once on the first run attempt.
let load: { loadMs: number; transferBytes: number | null; isFromCache: boolean } | null = null;

scope.onmessage = async (event) => {
  const { id, language, code } = event.data;
  const loadedNow = load === null;
  const startTime = performance.now();

  const recordLoad = (executionTime: number | undefined) => {
    if (load) return load;
    const loadMs = Math.max(0, performance.now() - startTime - (executionTime ?? 0));
    const measured = measureResourceTransfer(startTime, startTime + loadMs);
    load = {
      loadMs,
      transferBytes: measured.transferBytes,
      isFromCache: measured.isFromCache,
    };
    return load;
  };

  try {
    const output = await box.run({ language, code });
    const currentLoad = recordLoad(output.executionTime ?? undefined);

    const report: EngineRunReport = {
      output,
      loadMs: currentLoad.loadMs,
      transferBytes: currentLoad.transferBytes,
      isFromCache: currentLoad.isFromCache,
      loadedNow,
    };
    scope.postMessage({ id, report });
  } catch (caught) {
    recordLoad(undefined);
    const error = caught instanceof Error ? caught.message : String(caught);
    scope.postMessage({ id, error });
  }
};
