import type { ArtifactDiscovery, ArtifactMetadata, Finding, GovernedArtifact, SpecGovConfig } from "./types.js";
export declare function discoverArtifacts(config: SpecGovConfig, cwd: string): Promise<ArtifactDiscovery>;
export declare function readArtifactMetadata(filePath: string): Promise<ArtifactMetadata>;
export declare function buildArtifactFindings(config: SpecGovConfig, discovery: ArtifactDiscovery, now?: Date): Finding[];
export declare function artifactPathsMatching(artifacts: GovernedArtifact[], patterns: string | string[]): string[];
export declare function isArtifactPath(config: SpecGovConfig, filePath: string): boolean;
