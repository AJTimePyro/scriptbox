import { loader } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import { TOKENS } from "./theme/tokens";

// Serve Monaco's worker from the bundle instead of a CDN.
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco });

export const THEME_NAME = "scriptbox-ide";

export function defineTheme(monacoInstance: Monaco): void {
  monacoInstance.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: TOKENS.colors.text.replace("#", "") },
      { token: "keyword", foreground: TOKENS.syntax.keyword.replace("#", "") },
      { token: "string", foreground: TOKENS.syntax.string.replace("#", "") },
      { token: "number", foreground: TOKENS.syntax.number.replace("#", "") },
      { token: "type", foreground: TOKENS.syntax.function.replace("#", "") },
      { token: "type.identifier", foreground: TOKENS.syntax.function.replace("#", "") },
      { token: "function", foreground: TOKENS.syntax.function.replace("#", "") },
      { token: "comment", foreground: TOKENS.syntax.comment.replace("#", ""), fontStyle: "italic" },
      { token: "operator", foreground: TOKENS.syntax.operator.replace("#", "") },
      { token: "delimiter", foreground: TOKENS.syntax.operator.replace("#", "") },
      { token: "variable", foreground: TOKENS.syntax.variable.replace("#", "") },
      { token: "identifier", foreground: TOKENS.syntax.variable.replace("#", "") },
    ],
    colors: {
      "editor.background": TOKENS.colors.surface,
      "editor.foreground": TOKENS.colors.text,
      "editorLineNumber.foreground": TOKENS.colors.textFaint,
      "editorLineNumber.activeForeground": TOKENS.colors.textMuted,
      "editor.selectionBackground": `${TOKENS.colors.accent}26`,
      "editorCursor.foreground": TOKENS.colors.accent,
      "editor.lineHighlightBackground": `${TOKENS.colors.elevated}80`,
      "editorIndentGuide.background1": TOKENS.colors.borderSubtle,
      "editorIndentGuide.activeBackground1": TOKENS.colors.border,
      "editorOverviewRuler.border": "#00000000",
      "menu.background": TOKENS.colors.elevated,
      "menu.foreground": TOKENS.colors.text,
      "menu.border": TOKENS.colors.border,
      "menu.separatorBackground": TOKENS.colors.border,
      "scrollbarSlider.background": `${TOKENS.colors.border}66`,
      "scrollbarSlider.hoverBackground": `${TOKENS.colors.border}aa`,
      "scrollbarSlider.activeBackground": TOKENS.colors.border,
    },
  });
}

// Monaco's language type omits the loader that supplies keyword lists.
type LanguageWithLoader = monaco.languages.ILanguageExtensionPoint & {
  loader?: () => Promise<{ language?: { keywords?: string[] | string } }>;
};

const registered = new Set<string>();

export function ensureCompletions(languageId?: string): void {
  if (!languageId || registered.has(languageId)) return;
  registered.add(languageId);

  const entry = monaco.languages
    .getLanguages()
    .find((language) => language.id === languageId) as
    | LanguageWithLoader
    | undefined;
  if (!entry?.loader) return;

  void entry.loader().then(({ language }) => {
    const keywords = language?.keywords;
    if (!keywords) return;
    const words = Array.isArray(keywords) ? keywords : keywords.split(/\s+/);

    monaco.languages.registerCompletionItemProvider(languageId, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: words.map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: label,
            range,
          })),
        };
      },
    });
  });
}
