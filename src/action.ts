import * as core from "@actions/core";
import { analyzeRepository } from "./analyze.js";
import { loadSpecGovConfig } from "./config.js";
import { renderReport } from "./report.js";
import type { EnforcementMode, OutputFormat } from "./types.js";
async function main(): Promise<void> {
  try {
    const cwd = process.cwd();
    const mode = value<EnforcementMode>("mode", ["advisory", "strict"]);
    const output =
      value<OutputFormat>("output-format", ["terminal", "markdown", "json"]) ??
      "terminal";
    const configPath = core.getInput("config") || ".specgov.yml";
    const config = await loadSpecGovConfig({ cwd, configPath });
    const failurePolicy = value<"warn" | "fail">("semantic-failure-policy", [
      "warn",
      "fail",
    ]);
    if (failurePolicy) config.semantic.failure_policy = failurePolicy;
    const report = await analyzeRepository({
      cwd,
      config,
      mode,
      baseRef: core.getInput("base-ref") || undefined,
      headRef: core.getInput("head-ref") || undefined,
      changedFiles: core.getMultilineInput("changed-files").filter(Boolean),
      semantic: core.getBooleanInput("semantic"),
    });
    await core.summary.addRaw(renderReport(report, "markdown")).write();
    core.info(renderReport(report, output));
    core.setOutput("status", report.status);
    core.setOutput("report-json", JSON.stringify(report));
    core.setOutput("graph-json", JSON.stringify(report.graph));
    core.setOutput(
      "detected-frameworks",
      report.graph.detectedFrameworks.map((f) => f.id).join(","),
    );
    core.setOutput("finding-count", String(report.summary.findings));
    if (report.status === "fail")
      core.setFailed(
        `SpecGov failed with ${report.summary.findings} finding(s).`,
      );
  } catch (error) {
    core.setOutput("status", "error");
    core.setFailed((error as Error).message);
  }
}
function value<T extends string>(name: string, allowed: T[]): T | undefined {
  const input = core.getInput(name);
  if (!input) return undefined;
  if (allowed.includes(input as T)) return input as T;
  throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
}
await main();
