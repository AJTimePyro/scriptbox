import pythonSnippet from "../snippets/main.py?raw";
import rSnippet from "../snippets/main.R?raw";
import cppSnippet from "../snippets/main.cpp?raw";
import jsSnippet from "../snippets/main.js?raw";
import tsSnippet from "../snippets/main.ts?raw";
import rootPkg from "../../../package.json";

export type LanguageCategory = "Interpreted" | "Compiled";

export interface LanguageDefinition {
  id: string;
  name: string;
  glyph: string; // Short mono badge, e.g. "PY" or "C++"
  extension: string;
  fileName: string;
  monacoLanguage: string;
  category: LanguageCategory;
  aliases: string[];
  engine: {
    name: string;
    version?: string;
  };
  starterSnippet: string;
}

// Dev-only guard: starter snippets must stay ASCII.
function assertAsciiOnly(code: string, id: string): string {
  if (import.meta.env.DEV) {
    for (let i = 0; i < code.length; i++) {
      if (code.charCodeAt(i) > 127) {
        throw new Error(
          `Starter snippet for '${id}' contains non-ASCII character '${code[i]}' (code ${code.charCodeAt(i)}) at offset ${i}`,
        );
      }
    }
  }
  return code;
}

// Show the same engine versions the root package installs.
const devDeps = rootPkg.devDependencies as Record<string, string>;
const cleanVersion = (ver?: string) => ver?.replace(/^[^\d]*/, "") || undefined;

export const LANGUAGES: LanguageDefinition[] = [
  {
    id: "python",
    name: "Python",
    glyph: "PY",
    extension: "py",
    fileName: "main.py",
    monacoLanguage: "python",
    category: "Interpreted",
    aliases: ["py", "python", "python3", "py3"],
    engine: {
      name: "Pyodide",
      version: cleanVersion(devDeps.pyodide),
    },
    starterSnippet: assertAsciiOnly(pythonSnippet, "python"),
  },
  {
    id: "r",
    name: "R",
    glyph: "R",
    extension: "R",
    fileName: "main.R",
    monacoLanguage: "r",
    category: "Interpreted",
    aliases: ["r", "rstats", "rlang"],
    engine: {
      name: "webR",
      version: cleanVersion(devDeps.webr),
    },
    starterSnippet: assertAsciiOnly(rSnippet, "r"),
  },
  {
    id: "cpp",
    name: "C++",
    glyph: "C++",
    extension: "cpp",
    fileName: "main.cpp",
    monacoLanguage: "cpp",
    category: "Compiled",
    aliases: ["cpp", "c++", "cplusplus", "cc", "cxx"],
    engine: {
      name: "cppbolt",
      version: cleanVersion(devDeps.cppbolt),
    },
    starterSnippet: assertAsciiOnly(cppSnippet, "cpp"),
  },
  {
    id: "javascript",
    name: "JavaScript",
    glyph: "JS",
    extension: "js",
    fileName: "main.js",
    monacoLanguage: "javascript",
    category: "Interpreted",
    aliases: ["js", "javascript", "node", "nodejs"],
    engine: {
      name: "Browser",
    },
    starterSnippet: assertAsciiOnly(jsSnippet, "javascript"),
  },
  {
    id: "typescript",
    name: "TypeScript",
    glyph: "TS",
    extension: "ts",
    fileName: "main.ts",
    monacoLanguage: "typescript",
    category: "Compiled",
    aliases: ["ts", "typescript"],
    engine: {
      name: "TypeScript",
      version: cleanVersion(devDeps.typescript),
    },
    starterSnippet: assertAsciiOnly(tsSnippet, "typescript"),
  },
];

export const SEARCH_THRESHOLD = 6;

/**
 * Builds the header tagline from the language registry.
 * Up to four languages are named; larger registries show a count.
 */
export function getHeaderDescription(): string {
  if (LANGUAGES.length === 0) return "Run code in your browser. No backend.";
  if (LANGUAGES.length === 1) return `Run ${LANGUAGES[0].name} in your browser. No backend.`;
  if (LANGUAGES.length <= 4) {
    const names = LANGUAGES.map((l) => l.name);
    const last = names[names.length - 1];
    const rest = names.slice(0, -1).join(", ");
    return `Run ${rest} and ${last} in your browser. No backend.`;
  }
  return `Run ${LANGUAGES.length} languages in your browser. No backend.`;
}
