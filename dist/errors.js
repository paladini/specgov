export class SpecGovError extends Error {
    exitCode;
    constructor(message, exitCode = 2) {
        super(message);
        this.name = "SpecGovError";
        this.exitCode = exitCode;
    }
}
