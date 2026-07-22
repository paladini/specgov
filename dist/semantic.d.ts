import type { Finding, SemanticConfig, SpecGovReport } from "./types.js";
export declare function runSemanticAuditor(report: SpecGovReport, config: SemanticConfig): Promise<Finding[]>;
