export type EnforcementMode = "advisory" | "strict";
export type ArtifactRole =
  | "intent"
  | "spec"
  | "plan"
  | "design"
  | "task"
  | "decision"
  | "instruction"
  | "evidence"
  | "implementation";
export type ArtifactState =
  "draft" | "active" | "implemented" | "verified" | "superseded" | "archived";
export type ArtifactRelationType =
  "derives_from" | "governs" | "implements" | "verifies" | "supersedes";
export type Severity = "info" | "warning" | "error";
export type Confidence = "high" | "medium" | "low";
export type ReportStatus = "pass" | "warn" | "fail" | "error";
export type OutputFormat = "terminal" | "markdown" | "json";

export interface DeclaredProducer {
  tool?: string;
  model?: string;
  session?: string;
  generatedAt?: string;
  inputs?: string[];
}
export interface ArtifactNode {
  id: string;
  path: string;
  role: ArtifactRole;
  framework: string;
  changeSetId?: string;
  state?: ArtifactState;
  owner?: string;
  lastVerified?: string;
  scope?: string[];
  producer?: DeclaredProducer;
}
export interface ArtifactEdge {
  from: string;
  to: string;
  type: ArtifactRelationType;
  source: "detected" | "declared";
}
export interface ChangeSet {
  id: string;
  framework: string;
  root: string;
  artifactIds: string[];
  state: ArtifactState;
}
export interface DetectedFramework {
  id: string;
  confidence: Confidence;
  roots: string[];
}
export interface RepositoryIdentity {
  root: string;
  name: string;
}
export interface ArtifactGraph {
  schemaVersion: "1";
  repository: RepositoryIdentity;
  detectedFrameworks: DetectedFramework[];
  changeSets: ChangeSet[];
  artifacts: ArtifactNode[];
  relations: ArtifactEdge[];
}

export interface DetectionResult {
  detected: boolean;
  confidence: Confidence;
  roots: string[];
}
export interface ArtifactDraft {
  path: string;
  role: ArtifactRole;
  changeSetId?: string;
  state?: ArtifactState;
  relations?: Array<{ targetPath: string; type: ArtifactRelationType }>;
}
export interface ArtifactContribution {
  artifacts: ArtifactDraft[];
  changeSets: Array<{ id: string; root: string; state: ArtifactState }>;
}
export interface RepositoryContext {
  cwd: string;
  ignore: string[];
  allowSymlinks: boolean;
  generic?: GenericAdapterConfig;
}
export interface FrameworkAdapter {
  id: string;
  detect(context: RepositoryContext): Promise<DetectionResult>;
  discover(context: RepositoryContext): Promise<ArtifactContribution>;
}

export interface DomainConfig {
  id: string;
  code: string[];
  artifacts: string[];
}
export interface PolicyConfig {
  require_complete_chain: boolean;
  require_change_artifact_for_code: boolean;
  require_verification_evidence: boolean;
  stale_after_days: number;
}
export interface GenericRolePattern {
  role: ArtifactRole;
  patterns: string[];
}
export interface GenericAdapterConfig {
  roots: string[];
  roles: GenericRolePattern[];
}
export interface SemanticConfig {
  enabled: boolean;
  command?: string[];
  timeout_ms: number;
  max_output_bytes: number;
  failure_policy: "warn" | "fail";
}
export interface SpecGovConfig {
  schema: "specgov/v1";
  mode: EnforcementMode;
  frameworks: "auto" | string[];
  domains: DomainConfig[];
  policies: PolicyConfig;
  ignore: string[];
  allow_symlinks: boolean;
  generic?: GenericAdapterConfig;
  semantic: SemanticConfig;
}

export interface Finding {
  id: string;
  code: string;
  severity: Severity;
  message: string;
  paths: string[];
  artifactIds: string[];
  evidence: string[];
  remediation: string;
  confidence: Confidence;
}
export interface AnalysisSummary {
  frameworks: number;
  changeSets: number;
  artifacts: number;
  artifactCounts: Partial<Record<ArtifactRole, number>>;
  findings: number;
  errors: number;
  warnings: number;
  infos: number;
}
export interface SpecGovReport {
  schemaVersion: "1";
  status: ReportStatus;
  mode: EnforcementMode;
  graph: ArtifactGraph;
  changedFiles: string[];
  findings: Finding[];
  summary: AnalysisSummary;
}
export interface AnalyzeRepositoryOptions {
  cwd?: string;
  configPath?: string;
  config?: SpecGovConfig;
  baseRef?: string;
  headRef?: string;
  changedFiles?: string[];
  mode?: EnforcementMode;
  semantic?: boolean;
}
export interface DiscoverGraphOptions {
  cwd?: string;
  configPath?: string;
  config?: SpecGovConfig;
}
