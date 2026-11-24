import { useEffect, useRef } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { defineTheme, THEME_NAME } from "../monaco";
import type { CursorPosition } from "../types";

type Props = {
  language: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onCursorChange: (pos: CursorPosition) => void;
  isMobile?: boolean;
};

export function CodeEditor({
  language,
  path,
  value,
  onChange,
  onRun,
  onCursorChange,
  isMobile = false,
}: Props) {
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const onCursorChangeRef = useRef(onCursorChange);
  useEffect(() => {
    onCursorChangeRef.current = onCursorChange;
  }, [onCursorChange]);

  const beforeMount: BeforeMount = (monacoInstance) => defineTheme(monacoInstance);

  const onMount: OnMount = (editor, monacoInstance) => {
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      () => {
        onRunRef.current();
      },
    );

    editor.onDidChangeCursorPosition((e) => {
      onCursorChangeRef.current({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });
  };

  return (
    <div className="relative flex-1 min-h-0 w-full bg-surface">
      <Editor
        height="100%"
        width="100%"
        language={language}
        path={path}
        value={value}
        theme={THEME_NAME}
        beforeMount={beforeMount}
        onMount={onMount}
        loading={
          <div className="grid h-full place-items-center font-mono text-xs text-text-muted">
            initializing editor…
          </div>
        }
        onChange={(next) => onChange(next ?? "")}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
          fontSize: isMobile ? 13 : 14,
          fontLigatures: true,
          lineHeight: 22,
          padding: { top: 16, bottom: 16 },
          tabSize: 2,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "line",
          overviewRulerLanes: 0,
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
          contextmenu: !isMobile,
          wordWrap: "off",
          quickSuggestions: { other: "on", comments: "on", strings: "on" },
          wordBasedSuggestions: "currentDocument",
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
            useShadows: false,
          },
        }}
      />
    </div>
  );
}
