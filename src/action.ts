import * as core from "@actions/core";
import { runCheckPr } from "./checks.js";
import { loadConfig } from "./manifest.js";
import { renderMarkdownReport } from "./report.js";
import type { EnforcementMode } from "./types.js";

async function main(): Promise<void> {
  try {
    const cwd = process.cwd();
    const configPath = core.getInput("config") || ".specgov.yml";
    const modeInput = core.getInput("mode") || undefined;
    const mode = modeInput ? parseMode(modeInput) : undefined;
    const baseRef = core.getInput("base-ref") || undefined;
    const headRef = core.getInput("head-ref") || undefined;
    const changedFiles = core
      .getMultilineInput("changed-files")
      .filter(Boolean);
    const config = await loadConfig(cwd, configPath);
    const report = await runCheckPr({
      cwd,
      config,
      mode,
      baseRef,
      headRef,
      changedFiles,
    });
    const markdown = renderMarkdownReport(report);

    await core.summary.addRaw(markdown).write();
    core.info(markdown);
    core.setOutput("status", report.status);
    core.setOutput("report-json", JSON.stringify(report));

    if (report.status === "fail") {
      core.setFailed(
        `SpecGov failed with ${report.summary.findings} finding(s).`,
      );
    }
  } catch (error) {
    core.setOutput("status", "error");
    core.setFailed((error as Error).message);
  }
}

function parseMode(value: string): EnforcementMode {
  if (value === "advisory" || value === "strict") {
    return value;
  }
  throw new Error('mode must be "advisory" or "strict".');
}

await main();
