export declare class SpecGovError extends Error {
    readonly exitCode: number;
    constructor(message: string, exitCode?: number);
}
