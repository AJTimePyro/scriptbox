import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Play, Square } from "lucide-react";import { Header } from "./components/Header";
import { EditorPane } from "./components/EditorPane";
import { OutputPane } from "./components/OutputPane";
import { StatusBar } from "./components/StatusBar";
import { SandboxFrame } from "./components/SandboxFrame";
import { InstallModal } from "./components/InstallModal";
import { ensureCompletions } from "./monaco";
import { LANGUAGES, type LanguageDefinition } from "./config/languages";
import type { LanguageStateMap } from "./components/LanguageSelect";
import { createEngineClient } from "./utils/engine";
import { loadDrafts, saveDraft } from "./utils/drafts";
import type {
  CursorPosition,
  LanguageRuntimeInfo,
  RunMetrics,
  RunOutput,
  RunStatus,
} from "./types";

const emptyOutput: RunOutput = {
  stdout: "",
  stderr: "",
  executionTime: null,
};

const initialMetrics: RunMetrics = {
  packageLoadMs: null,
  compileMs: null,
  runMs: null,
  totalMs: null,
  transferBytes: null,
  isFromCache: false,
  cached: false,
};

const unloadedRuntimeState: LanguageStateMap[string] = {
  state: "unloaded",
  loadMs: null,
  transferBytes: null,
  isFromCache: false,
};

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(LANGUAGES[0].id);

  // Drafts persist in localStorage; output, metrics and runtime state are session-only.
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    loadDrafts(
      Object.fromEntries(LANGUAGES.map((lang) => [lang.id, lang.starterSnippet])),
    ),
  );

  const [outputsByLang, setOutputsByLang] = useState<Record<string, RunOutput>>(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.id, emptyOutput])),
  );

  const [metricsByLang, setMetricsByLang] = useState<Record<string, RunMetrics>>(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.id, initialMetrics])),
  );

  const [runtimeStates, setRuntimeStates] = useState<LanguageStateMap>(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.id, unloadedRuntimeState])),
  );

  const [status, setStatus] = useState<RunStatus>("idle");
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");

  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, col: 1 });
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  // One engine worker per language, created on first run
  const engineClients = useRef(new Map<string, ReturnType<typeof createEngineClient>>());

  // Incremented on each run and stop so stale results from an aborted run are ignored
  const runToken = useRef(0);

  // Set before the await so two clicks in one tick cannot both start a run
  const runningRef = useRef(false);

  const saveTimer = useRef<number | null>(null);
  const pendingSave = useRef<{ id: string; code: string } | null>(null);

  const flushSave = useCallback(() => {
    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const pending = pendingSave.current;
    pendingSave.current = null;
    if (pending) saveDraft(pending.id, pending.code);
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.addEventListener("pagehide", flushSave);
    return () => {
      window.removeEventListener("pagehide", flushSave);
      flushSave();
    };
  }, [flushSave]);

  useEffect(() => {
    const clients = engineClients.current;
    return () => {
      for (const client of clients.values()) client.stop();
    };
  }, []);

  const isDesktop = viewportWidth >= 1024;
  const isMobile = viewportWidth < 640;
  const isBusy = status === "running" || isRuntimeLoading;

  const currentLanguage = useMemo(
    () => LANGUAGES.find((l) => l.id === selectedId) || LANGUAGES[0],
    [selectedId],
  );

  const code = drafts[currentLanguage.id] ?? currentLanguage.starterSnippet;
  const currentOutput = outputsByLang[currentLanguage.id] ?? emptyOutput;
  const currentMetrics = metricsByLang[currentLanguage.id] ?? initialMetrics;

  const handleCodeChange = (newCode: string) => {
    const languageId = currentLanguage.id;
    setDrafts((prev) => ({ ...prev, [languageId]: newCode }));

    pendingSave.current = { id: languageId, code: newCode };
    if (saveTimer.current !== null) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      const pending = pendingSave.current;
      pendingSave.current = null;
      if (pending) saveDraft(pending.id, pending.code);
    }, 300);
  };

  const stopRun = useCallback((language: LanguageDefinition) => {
    runToken.current += 1;
    runningRef.current = false;
    engineClients.current.get(language.id)?.stop();
    setIsRuntimeLoading(false);
    setStatus("idle");
    setRuntimeStates((prev) => ({ ...prev, [language.id]: unloadedRuntimeState }));
    setAriaAnnouncement(`Stopped ${language.name}.`);
  }, []);

  // Switching language kills any work in flight and moves to the other language's code
  const handleSelectLanguage = (id: string) => {
    if (id === selectedId) return;
    flushSave();
    if (isBusy) stopRun(currentLanguage);
    setSelectedId(id);
    setStatus("idle");
  };

  const handleReset = () => {
    handleCodeChange(currentLanguage.starterSnippet);
    setOutputsByLang((prev) => ({ ...prev, [currentLanguage.id]: emptyOutput }));
    setMetricsByLang((prev) => ({ ...prev, [currentLanguage.id]: initialMetrics }));
    setStatus("idle");
  };

  const handleClear = () => {
    setOutputsByLang((prev) => ({ ...prev, [currentLanguage.id]: emptyOutput }));
    setStatus("idle");
  };

  const handleRun = useCallback(async () => {
    if (runningRef.current || status === "running" || isRuntimeLoading) return;

    const language = currentLanguage;
    const languageId = language.id;
    const codeToRun = drafts[languageId] ?? language.starterSnippet;
    const runtimeAlreadyLoaded = runtimeStates[languageId]?.state === "ready";
    const token = ++runToken.current;
    runningRef.current = true;

    let client = engineClients.current.get(languageId);
    if (!client) {
      client = createEngineClient(languageId);
      engineClients.current.set(languageId, client);
    }

    if (!runtimeAlreadyLoaded) {
      setIsRuntimeLoading(true);
      setRuntimeStates((prev) => ({
        ...prev,
        [languageId]: { ...unloadedRuntimeState, state: "loading" },
      }));
    }

    setStatus("running");
    setAriaAnnouncement(`Running ${language.name} code...`);

    const startTime = performance.now();

    try {
      const report = await client.run(codeToRun);
      if (runToken.current !== token) return;

      const totalWallClock = performance.now() - startTime;
      const executionTime = report.output.executionTime ?? 0;

      setRuntimeStates((prev) => ({
        ...prev,
        [languageId]: {
          state: "ready",
          loadMs: report.loadMs,
          transferBytes: report.transferBytes,
          isFromCache: report.isFromCache,
        },
      }));
      setIsRuntimeLoading(false);
      const exitCode = report.output.exitCode;
      setStatus(exitCode !== undefined && exitCode !== 0 ? "error" : "done");

      setOutputsByLang((prev) => ({
        ...prev,
        [languageId]: report.output,
      }));

      setMetricsByLang((prev) => ({
        ...prev,
        [languageId]: {
          packageLoadMs: report.loadMs,
          compileMs: null,
          runMs: executionTime,
          totalMs: totalWallClock,
          transferBytes: report.transferBytes,
          isFromCache: report.isFromCache,
          cached: !report.loadedNow,
        },
      }));

      setAriaAnnouncement(
        `Run finished successfully in ${Math.round(totalWallClock)} milliseconds.`,
      );
    } catch (caught) {
      if (runToken.current !== token) return;

      const totalWallClock = performance.now() - startTime;

      const errorMessage = caught instanceof Error ? caught.message : String(caught);

      if (!runtimeAlreadyLoaded) {
        setRuntimeStates((prev) => ({
          ...prev,
          [languageId]: unloadedRuntimeState,
        }));
      }

      setIsRuntimeLoading(false);
      setStatus("error");

      setOutputsByLang((prev) => ({
        ...prev,
        [languageId]: {
          stdout: "",
          stderr: errorMessage,
          executionTime: null,
        },
      }));

      setMetricsByLang((prev) => ({
        ...prev,
        [languageId]: {
          packageLoadMs: prev[languageId]?.packageLoadMs ?? null,
          compileMs: null,
          runMs: null,
          totalMs: totalWallClock,
          transferBytes: prev[languageId]?.transferBytes ?? null,
          isFromCache: prev[languageId]?.isFromCache ?? false,
          cached: runtimeAlreadyLoaded,
        },
      }));

      setAriaAnnouncement(`Run failed with error: ${errorMessage}`);
    } finally {
      if (runToken.current === token) runningRef.current = false;
    }
  }, [currentLanguage, drafts, status, isRuntimeLoading, runtimeStates]);

  useEffect(() => {
    ensureCompletions(currentLanguage.monacoLanguage);
  }, [currentLanguage.monacoLanguage]);

  const runtimesList: LanguageRuntimeInfo[] = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        id: lang.id,
        label: lang.name,
        filename: lang.fileName,
        engineName: lang.engine.name,
        version: lang.engine.version ?? "latest",
        state: runtimeStates[lang.id]?.state ?? "unloaded",
        loadMs: runtimeStates[lang.id]?.loadMs ?? null,
        transferBytes: runtimeStates[lang.id]?.transferBytes ?? null,
        isFromCache: runtimeStates[lang.id]?.isFromCache ?? false,
      })),
    [runtimeStates],
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-base text-text">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaAnnouncement}
      </div>

      <Header
        runtimes={runtimesList}
        onOpenInstallModal={() => setIsInstallOpen(true)}
      />

      <div className="flex min-h-0 flex-1 p-2 max-sm:p-1.5 overflow-hidden">
        <SandboxFrame className="border border-border rounded-sm overflow-hidden bg-surface shadow-xs">
          <Group
            orientation={isDesktop ? "horizontal" : "vertical"}
            className="h-full w-full"
          >
            <Panel
              defaultSize={isDesktop ? "58%" : "50%"}
              minSize={isDesktop ? "32%" : "30%"}
              className="flex flex-col min-h-0 min-w-0"
            >
              <EditorPane
                languages={LANGUAGES}
                selectedLanguage={currentLanguage}
                runtimeStates={runtimeStates}
                code={code}
                status={status}
                isRuntimeLoading={isRuntimeLoading}
                canReset={Boolean(code)}
                onSelectLanguage={handleSelectLanguage}
                onReset={handleReset}
                onRun={handleRun}
                onStop={() => stopRun(currentLanguage)}
                onCodeChange={handleCodeChange}
                onCursorChange={setCursor}
                isMobile={isMobile}
              />
            </Panel>

            <Separator className="group relative flex shrink-0 items-center justify-center bg-border transition-colors duration-150 hover:bg-accent/60 data-[separator='active']:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent w-px data-[orientation='vertical']:w-full data-[orientation='vertical']:h-px" />

            <Panel
              defaultSize={isDesktop ? "42%" : "50%"}
              minSize={isDesktop ? "28%" : "25%"}
              className="flex flex-col min-h-0 min-w-0"
            >
              <OutputPane
                output={currentOutput}
                status={status}
                metrics={currentMetrics}
                isInterpreted={currentLanguage.category === "Interpreted"}
                onClear={handleClear}
              />
            </Panel>
          </Group>
        </SandboxFrame>
      </div>

      {isMobile && (
        <div className="shrink-0 border-t border-border bg-surface p-1.5 z-20">
          <button
            type="button"
            onClick={isBusy ? () => stopRun(currentLanguage) : handleRun}
            aria-label={isBusy ? "Stop run" : `Run ${currentLanguage.name}`}
            className={`flex min-h-[42px] w-full items-center justify-center gap-2 rounded px-4 py-2 font-mono text-xs font-semibold shadow-xs transition-all active:scale-[0.99] ${
              isBusy ? "bg-error text-white" : "bg-accent text-accent-fg"
            }`}
          >
            {isBusy ? (
              <>
                <Square size={12} className="fill-current" strokeWidth={2} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" strokeWidth={1.5} />
                <span>Run {currentLanguage.name}</span>
              </>
            )}
          </button>
        </div>
      )}

      <StatusBar
        status={status}
        isRuntimeLoading={isRuntimeLoading}
        cursor={cursor}
        engineInfo={{
          name: currentLanguage.engine.name,
          version: currentLanguage.engine.version,
        }}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
    </div>
  );
}
