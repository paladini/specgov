import type { SpecGovConfig, SpecGovReport, TraceIndex } from "./types.js";
interface BaseOptions {
    cwd: string;
    config: SpecGovConfig;
}
export interface CheckPrOptions extends BaseOptions {
    baseRef?: string;
    headRef?: string;
    changedFiles?: string[];
    mode?: "advisory" | "strict";
}
export declare function runScan(options: BaseOptions): Promise<SpecGovReport>;
export declare function runCheckPr(options: CheckPrOptions): Promise<SpecGovReport>;
export declare function runTrace(options: BaseOptions): Promise<TraceIndex>;
export declare function runDrift(options: BaseOptions): Promise<SpecGovReport>;
export {};
