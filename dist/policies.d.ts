import type { ArtifactGraph, Finding, SpecGovConfig } from "./types.js";
export declare function runPolicies(graph: ArtifactGraph, config: SpecGovConfig, changedFiles?: string[], now?: Date): Finding[];
