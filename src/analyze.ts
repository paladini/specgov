import path from "node:path";
import { createHash } from "node:crypto";
import { discoverArtifactGraph } from "./graph.js";
import { getChangedFiles } from "./git.js";
import { loadSpecGovConfig } from "./config.js";
import { runPolicies } from "./policies.js";
import { runSemanticAuditor } from "./semantic.js";
import type {
  AnalyzeRepositoryOptions,
  Finding,
  SpecGovReport,
} from "./types.js";

export async function analyzeRepository(
  options: AnalyzeRepositoryOptions = {},
): Promise<SpecGovReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const config =
    options.config ??
    (await loadSpecGovConfig({ cwd, configPath: options.configPath }));
  const effective = { ...config, mode: options.mode ?? config.mode };
  const graph = await discoverArtifactGraph({ cwd, config: effective });
  const changedFiles = await getChangedFiles({
    cwd,
    baseRef: options.baseRef,
    headRef: options.headRef,
    explicitFiles: options.changedFiles,
  });
  let findings = runPolicies(graph, effective, changedFiles);
  let report = makeReport(effective.mode, graph, changedFiles, findings);
  if (options.semantic || effective.semantic.enabled) {
    try {
      findings = [
        ...findings,
        ...(await runSemanticAuditor(report, effective.semantic, cwd)),
      ];
    } catch (error) {
      const fail =
        effective.mode === "strict" &&
        effective.semantic.failure_policy === "fail";
      findings.push(semanticFailure((error as Error).message, fail));
    }
    report = makeReport(effective.mode, graph, changedFiles, findings);
  }
  return report;
}
function makeReport(
  mode: SpecGovReport["mode"],
  graph: SpecGovReport["graph"],
  changedFiles: string[],
  findings: Finding[],
): SpecGovReport {
  const errors = findings.filter((f) => f.severity === "error").length,
    warnings = findings.filter((f) => f.severity === "warning").length,
    infos = findings.filter((f) => f.severity === "info").length;
  const status =
    errors || (mode === "strict" && warnings)
      ? "fail"
      : warnings || infos
        ? "warn"
        : "pass";
  const artifactCounts: SpecGovReport["summary"]["artifactCounts"] = {};
  for (const a of graph.artifacts)
    artifactCounts[a.role] = (artifactCounts[a.role] ?? 0) + 1;
  return {
    schemaVersion: "1",
    status,
    mode,
    graph,
    changedFiles,
    findings: findings.sort((a, b) => a.id.localeCompare(b.id)),
    summary: {
      frameworks: graph.detectedFrameworks.length,
      changeSets: graph.changeSets.length,
      artifacts: graph.artifacts.length,
      artifactCounts,
      findings: findings.length,
      errors,
      warnings,
      infos,
    },
  };
}
function semanticFailure(message: string, fail: boolean): Finding {
  return {
    id: `semantic_auditor_failed:${createHash("sha256").update(message).digest("hex").slice(0, 12)}`,
    code: "SEMANTIC_AUDITOR_FAILED",
    severity: fail ? "error" : "warning",
    message,
    paths: [],
    artifactIds: [],
    evidence: ["Deterministic findings completed before the plugin failed."],
    remediation: "Fix or disable the semantic auditor command.",
    confidence: "high",
  };
}
