# ScriptBox

ScriptBox runs Python, R, C++, Go, JavaScript, and TypeScript from JavaScript, in the browser or in Node. Python, R, C++, and Go execute in WASM runtimes. TypeScript is transpiled with the TypeScript compiler, and its output runs through the JavaScript runner.

Try the [live playground](https://ajtimepyro.is-a.dev/scriptbox/) without installing anything.

## Install

The npm release is coming soon. Until then, build from a checkout:

```
npm install
npm run build
```

The build emits `dist/index.mjs` and `dist/index.d.mts` as the ESM entry point and type declarations. Use `import`. When the release lands, installation will be `npm install scriptbox`.

## Quick start

Once the package is installed or linked from a local build:

```js
import { ScriptBox } from "scriptbox";

const box = new ScriptBox();

const result = await box.run({
  language: "python",
  code: 'print("hello")',
});

console.log(result.stdout);
console.log(result.executionTime); // milliseconds
```

## API

The runtime entry point exports `ScriptBox`. Its type declarations also export `ScriptBoxOptions` and `LanguageInfo`. `RunOptions` and `RunResult` are not exported.

### `new ScriptBox(options?)`

`options.go` overrides the yaegi URLs when you self-host the Go runtime:

```js
const box = new ScriptBox({
  go: {
    wasmUrl: "/yaegi-browser.wasm",
    execUrl: "/wasm_exec.js",
  },
});
```

`wasmUrl` points at a yaegi WASM binary. `execUrl` points at `wasm_exec.js` from the Go toolchain that built that binary. A mismatched pair fails during instantiation.

`go` is the only runner option `ScriptBox` passes through. The `PythonRunner`, `RRunner`, and `CppRunner` classes accept `pyodideVersion`, `webRVersion`, and `cppboltVersion`, but `ScriptBox` constructs those runners with their defaults.

### `box.getLanguages()`

Returns `{ id, label, template }` for each language. Pass `id` to `run()`. `template` is a starter snippet for that language.

### `box.run(options)`

`RunOptions`:

| Field | Type | Notes |
| --- | --- | --- |
| `language` | `string` | One of the ids in the language table below. |
| `code` | `string` | Source to execute. |
| `timeout` | `number?` | Milliseconds. C++ only, forwarded to cppbolt as `timeoutMs`. |

`RunResult`:

| Field | Type | Notes |
| --- | --- | --- |
| `stdout` | `string` | Captured standard output. |
| `stderr` | `string` | Captured errors and diagnostics. |
| `executionTime` | `number` | Milliseconds, including transpilation for TypeScript. |
| `exitCode` | `number?` | C++ and Go report 0 on success. JavaScript and TypeScript set it on failure. Python and R leave it unset. |

An unknown `language` rejects with an error whose `name` is `UnsupportedLanguage`. The error classes are internal and not exported.

## Languages and runtimes

| id | Language | Engine | Runtime source |
| --- | --- | --- | --- |
| `python` | Python | [Pyodide](https://pyodide.org/en/stable/) ([repo](https://github.com/pyodide/pyodide)) | jsDelivr, `@0` version range |
| `r` | R | [WebR](https://docs.r-wasm.org/webr/latest/) 0.6.0 ([repo](https://github.com/r-wasm/webr)) | webr.r-wasm.org |
| `cpp` | C++ | [cppbolt](https://github.com/AJTimePyro/cppbolt) 1.1.0 | jsDelivr in the browser, installed package in Node |
| `go` | Go | [yaegi-wasm](https://www.npmjs.com/package/yaegi-wasm) 1.0.2 | jsDelivr; URLs overridable through `options.go` |
| `javascript` | JavaScript | [`AsyncFunction`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction) | No runtime load |
| `typescript` | TypeScript | [TypeScript](https://www.typescriptlang.org/) 6.0.3 | jsDelivr in the browser, installed package in Node; output runs through the JavaScript runner |

Python, R, and Go fetch their runtimes over the network even in Node. C++ and TypeScript resolve installed npm packages there.

## Execution behavior

ScriptBox caches one runner per language. Each runner loads its runtime on the first `run()` and reuses it after that. The runtime imports use dynamic URLs marked `@vite-ignore`, so bundlers leave them for the browser or Node to resolve at call time.

Output handling varies by runner. Python installs stdout and stderr handlers with local buffers and resets them to no-op after each run. R captures each call in its shelter and purges it afterward. Go clears its capture buffers and serializes evaluations because it patches global `fs.writeSync` and depends on globals that yaegi registers. Go polls for up to 3 seconds for the WASM module to register its eval function during load.

Only C++ uses `timeout`. JavaScript and Go ignore it, and Python, R, and TypeScript never read it. To stop code that never yields, terminate the worker that owns the run. The playground does this. The JavaScript runner awaits outstanding `setTimeout` callbacks but does not track `setInterval`, so an interval can outlive the returned promise.

Exit codes:

- C++ returns 0 on success, 1 on a compile error, and 124 on timeout.
- Go returns 0 or 1 based on the evaluation result.
- JavaScript sets 1 when the function throws and leaves it unset otherwise.
- TypeScript sets 1 when compilation reports diagnostics and otherwise inherits the JavaScript runner result.

TypeScript diagnostics go to `stderr` with line and column numbers.

## Security

ScriptBox does not sandbox user code on its own. The risk depends on where `box.run()` executes.

### Node

Code runs in the host process with its privileges. It can import `node:fs`, read `process.env`, open sockets, and spawn child processes. Run trusted code, or execute it in a child process with OS-level limits.

### Browser

On a page's main thread, code gets the page's origin. It can read and change the DOM, read `localStorage` and non-HttpOnly cookies, and send data with `fetch`. Pyodide exposes JS globals to Python code as well. Run untrusted code in a dedicated Worker: it has no DOM, but it keeps `fetch` and can still send data. Terminate the Worker to stop a run that never yields. The playground uses one Worker per language and terminates it on stop.

For data that must stay out of reach, run the Worker inside an iframe with `sandbox="allow-scripts"`. Without `allow-same-origin`, that iframe gets an opaque origin and cannot reach the parent page's storage or cookies.

## Development

```
npm install
npm run build  # tsdown, writes dist/
npm run dev    # watch build
```

The playground has its own lockfile and aliases `scriptbox` to `src/index.ts`, so edits appear without rebuilding the package. Run `npm run build` inside `playground/` to type-check and build the app. The Pages workflow deploys `playground/dist` on pushes to `main`.

The library has no test suite. The playground has unit tests for its utility modules, run with `npm test` inside `playground/`.

## License

Apache License 2.0. See [LICENSE](LICENSE).
