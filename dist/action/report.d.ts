import type { EnforcementMode, Finding, ReportStatus, SpecGovReport } from "./types.js";
export declare function evaluateStatus(findings: Finding[], mode: EnforcementMode): ReportStatus;
export declare function makeReport(input: Omit<SpecGovReport, "status" | "summary">): SpecGovReport;
export declare function exitCodeForReport(report: SpecGovReport): number;
export declare function renderReport(report: SpecGovReport, format?: "json" | "markdown"): string;
export declare function renderMarkdownReport(report: SpecGovReport): string;
