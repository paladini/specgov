import {
  artifactPathsMatching,
  buildArtifactFindings,
  discoverArtifacts,
  isArtifactPath,
} from "./artifacts.js";
import { getChangedFiles } from "./git.js";
import { matchesAny } from "./match.js";
import { toArray } from "./paths.js";
import { makeReport } from "./report.js";
import type {
  Finding,
  SpecGovConfig,
  SpecGovReport,
  TraceIndex,
} from "./types.js";

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

export async function runScan(options: BaseOptions): Promise<SpecGovReport> {
  const discovery = await discoverArtifacts(options.config, options.cwd);
  const findings = buildArtifactFindings(options.config, discovery);
  return makeReport({
    command: "scan",
    mode: options.config.mode,
    findings,
    artifacts: discovery.artifacts,
  });
}

export async function runCheckPr(
  options: CheckPrOptions,
): Promise<SpecGovReport> {
  const config = options.mode
    ? { ...options.config, mode: options.mode }
    : options.config;
  const discovery = await discoverArtifacts(config, options.cwd);
  const changedFiles = await getChangedFiles({
    cwd: options.cwd,
    baseRef: options.baseRef,
    headRef: options.headRef,
    explicitFiles: options.changedFiles,
  });
  const filteredChangedFiles = changedFiles.filter(
    (file) => !matchesAny(file, config.ignore),
  );
  const findings = [
    ...buildArtifactFindings(config, discovery),
    ...buildImpactFindings(config, filteredChangedFiles),
  ];

  return makeReport({
    command: "check-pr",
    mode: config.mode,
    findings,
    artifacts: discovery.artifacts,
    changedFiles: filteredChangedFiles,
  });
}

export async function runTrace(options: BaseOptions): Promise<TraceIndex> {
  const discovery = await discoverArtifacts(options.config, options.cwd);
  return {
    generatedAt: new Date().toISOString(),
    artifacts: discovery.artifacts,
    mappings: options.config.mappings.map((mapping) => ({
      code: toArray(mapping.code),
      specs: toArray(mapping.specs),
      matchedArtifacts: artifactPathsMatching(
        discovery.artifacts,
        mapping.specs,
      ),
      description: mapping.description,
    })),
  };
}

export async function runDrift(options: BaseOptions): Promise<SpecGovReport> {
  const discovery = await discoverArtifacts(options.config, options.cwd);
  const trace = await runTrace(options);
  const findings = [
    ...buildArtifactFindings(options.config, discovery),
    ...buildOrphanFindings(
      options.config,
      discovery.artifacts.map((artifact) => artifact.path),
    ),
  ];

  return makeReport({
    command: "drift",
    mode: options.config.mode,
    findings,
    artifacts: discovery.artifacts,
    trace,
  });
}

function buildImpactFindings(
  config: SpecGovConfig,
  changedFiles: string[],
): Finding[] {
  const findings: Finding[] = [];
  const mappedCodeFiles = new Set<string>();

  for (const mapping of config.mappings) {
    const changedCode = changedFiles.filter((file) =>
      matchesAny(file, mapping.code),
    );
    if (changedCode.length === 0) {
      continue;
    }
    for (const file of changedCode) {
      mappedCodeFiles.add(file);
    }
    const changedSpecs = changedFiles.filter((file) =>
      matchesAny(file, mapping.specs),
    );
    if (changedSpecs.length === 0) {
      findings.push({
        code: "SPEC_IMPACT_MISSING",
        severity: "warning",
        message: `Code changed under ${toArray(mapping.code).join(", ")} without a related spec artifact change.`,
        relatedFiles: [...changedCode, ...toArray(mapping.specs)],
        suggestion:
          "Update a mapped spec artifact or run in advisory mode until this mapping is ready to enforce.",
      });
    }
  }

  if (config.rules.require_spec_impact_for_code_changes) {
    for (const file of changedFiles) {
      const isMapped = mappedCodeFiles.has(file);
      const isGovernedArtifact = isArtifactPath(config, file);
      const isManifest = file === ".specgov.yml";
      if (!isMapped && !isGovernedArtifact && !isManifest) {
        findings.push({
          code: "CODE_CHANGE_UNMAPPED",
          severity: "warning",
          message: `Changed file ${file} is not covered by a code-to-spec mapping.`,
          file,
          suggestion:
            "Add a mapping for this code area or ignore it explicitly.",
        });
      }
    }
  }

  return findings;
}

function buildOrphanFindings(
  config: SpecGovConfig,
  artifactPaths: string[],
): Finding[] {
  if (config.mappings.length === 0) {
    return [];
  }
  return artifactPaths
    .filter(
      (artifactPath) =>
        !config.mappings.some((mapping) =>
          matchesAny(artifactPath, mapping.specs),
        ),
    )
    .map((artifactPath) => ({
      code: "ARTIFACT_ORPHANED",
      severity: "info" as const,
      message: `Governed artifact ${artifactPath} is not referenced by any mapping.`,
      file: artifactPath,
      suggestion:
        "Reference this artifact from a mapping if it should participate in PR impact checks.",
    }));
}
