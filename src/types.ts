export type EnforcementMode = "advisory" | "strict";
export type ArtifactStatus =
  "draft" | "active" | "superseded" | "deprecated" | "archived";
export type ReportStatus = "pass" | "warn" | "fail" | "error";
export type Severity = "info" | "warning" | "error";

export interface ArtifactRule {
  path: string | string[];
  kind: string;
  owner?: string;
  status?: ArtifactStatus;
}

export interface MappingRule {
  code: string | string[];
  specs: string | string[];
  description?: string;
}

export interface GovernanceRules {
  require_spec_impact_for_code_changes: boolean;
  require_lifecycle_status: boolean;
  require_owner_for_active_specs: boolean;
  stale_after_days: number;
}

export interface SpecGovConfig {
  version: number;
  mode: EnforcementMode;
  artifacts: ArtifactRule[];
  mappings: MappingRule[];
  rules: GovernanceRules;
  ignore: string[];
}

export interface ArtifactMetadata {
  status?: ArtifactStatus;
  owner?: string;
  last_verified?: string;
  superseded_by?: string;
}

export interface GovernedArtifact {
  path: string;
  kind: string;
  owner?: string;
  status?: ArtifactStatus;
  lastVerified?: string;
  supersededBy?: string;
}

export interface ArtifactDiscovery {
  artifacts: GovernedArtifact[];
  ruleMatchCounts: Array<{
    path: string | string[];
    kind: string;
    count: number;
  }>;
}

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
  file?: string;
  relatedFiles?: string[];
  suggestion?: string;
}

export interface SpecGovReport {
  command: string;
  status: ReportStatus;
  mode: EnforcementMode;
  summary: {
    findings: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  findings: Finding[];
  artifacts?: GovernedArtifact[];
  changedFiles?: string[];
  trace?: TraceIndex;
}

export interface TraceIndex {
  generatedAt: string;
  artifacts: GovernedArtifact[];
  mappings: Array<{
    code: string[];
    specs: string[];
    matchedArtifacts: string[];
    description?: string;
  }>;
}
