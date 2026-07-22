import type { ArtifactGraph, OutputFormat, SpecGovReport } from "./types.js";
export declare function renderReport(report: SpecGovReport, format?: OutputFormat): string;
export declare function renderGraph(graph: ArtifactGraph, format?: "json" | "markdown"): string;
export declare function exitCodeForReport(report: SpecGovReport): number;
