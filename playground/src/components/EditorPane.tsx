import { EditorToolbar } from "./EditorToolbar";
import { CodeEditor } from "./CodeEditor";
import type { LanguageDefinition } from "../config/languages";
import type { LanguageStateMap } from "./LanguageSelect";
import type { RunStatus, CursorPosition } from "../types";
import { copyText } from "../utils/clipboard";

type Props = {
  languages: LanguageDefinition[];
  selectedLanguage: LanguageDefinition;
  runtimeStates: LanguageStateMap;
  code: string;
  status: RunStatus;
  isRuntimeLoading: boolean;
  canReset: boolean;
  onSelectLanguage: (id: string) => void;
  onReset: () => void;
  onRun: () => void;
  onStop: () => void;
  onCodeChange: (code: string) => void;
  onCursorChange: (pos: CursorPosition) => void;
  isMobile?: boolean;
};

export function EditorPane({
  languages,
  selectedLanguage,
  runtimeStates,
  code,
  status,
  isRuntimeLoading,
  canReset,
  onSelectLanguage,
  onReset,
  onRun,
  onStop,
  onCodeChange,
  onCursorChange,
  isMobile = false,
}: Props) {
  const handleCopyCode = () => copyText(code);

  return (
    <section
      aria-label="Code Editor"
      className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-surface"
    >
      <EditorToolbar
        languages={languages}
        selectedLanguage={selectedLanguage}
        runtimeStates={runtimeStates}
        status={status}
        isRuntimeLoading={isRuntimeLoading}
        canReset={canReset}
        onSelectLanguage={onSelectLanguage}
        onReset={onReset}
        onRun={onRun}
        onStop={onStop}
        onCopyCode={handleCopyCode}
        isMobile={isMobile}
      />

      <CodeEditor
        language={selectedLanguage.monacoLanguage}
        path={selectedLanguage.fileName}
        value={code}
        onChange={onCodeChange}
        onRun={onRun}
        onCursorChange={onCursorChange}
        isMobile={isMobile}
      />
    </section>
  );
}
