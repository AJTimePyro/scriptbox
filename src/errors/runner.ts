export class RunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerError";
  }
}

export class LibraryNotLoadedError extends RunnerError {
  constructor(message?: string) {
    super(message || "The runner library has not been loaded.");
    this.name = "LibraryNotLoadedError";
  }
}

export class UnsupportedLanguage extends RunnerError {
  constructor(libray_name: string) {
    super(`${libray_name} language is not a supported or an invalid language name.`);
    this.name = "UnsupportedLanguage";
  }
}

export class ExecutionError extends RunnerError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}
