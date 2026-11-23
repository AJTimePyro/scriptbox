export const GITHUB_REPO_URL = "https://github.com/scriptbox-wasm/scriptbox";
export const DOCS_URL = "https://github.com/scriptbox-wasm/scriptbox#readme";

export const INSTALL_SNIPPET = {
  packageManager: "npm install scriptbox",
  pnpm: "pnpm add scriptbox",
  yarn: "yarn add scriptbox",
  usage: `import { ScriptBox } from "scriptbox";

const box = new ScriptBox();

// Run Python, R, C++, JavaScript, or TypeScript directly in the browser
const result = await box.run({
  language: "python",
  code: 'print("Running 100% client-side")',
});

console.log(result.stdout);
console.log(\`Execution time: \${result.executionTime}ms\`);`,
};
