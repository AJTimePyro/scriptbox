export interface PythonRunnerOptions {
  pyodideVersion?: string;
}

export interface RRunnerOptions {
  webRVersion?: string;
}

export interface CppRunnerOptions {
  cppboltVersion?: string;
}

export interface GoRunnerOptions {
  /** URL of a yaegi WASM binary. Defaults to the hosted yaegi-wasm package. */
  wasmUrl?: string;
  /** URL of wasm_exec.js from the Go toolchain that built the WASM binary. */
  execUrl?: string;
}
