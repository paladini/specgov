export class SpecGovError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 2) {
    super(message);
    this.name = "SpecGovError";
    this.exitCode = exitCode;
  }
}
