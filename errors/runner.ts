export class RunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerError";
  }
}

export class LibraryNotLoadedError extends RunnerError {
  constructor() {
    super("The runner library has not been loaded.");
    this.name = "LibraryNotLoadedError";
  }
}

export class ExecutionError extends RunnerError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionError";
  }
}
