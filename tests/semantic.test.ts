import { describe, expect, it } from "vitest";
import { analyzeRepository, loadSpecGovConfig } from "../src/index.js";
import { makeRepo, writeFixture } from "./helpers.js";

async function semanticReport(
  script: string,
  mode: "advisory" | "strict" = "strict",
) {
  const cwd = await makeRepo();
  await writeFixture(cwd, "auditor.mjs", script);
  const config = await loadSpecGovConfig({ cwd });
  config.mode = mode;
  config.semantic = {
    enabled: true,
    command: [process.execPath, `${cwd}/auditor.mjs`],
    timeout_ms: 200,
    max_output_bytes: 1_000,
    failure_policy: "fail",
  };
  return analyzeRepository({ cwd, config, changedFiles: [] });
}

describe("semantic auditor failure isolation", () => {
  it.each([
    ["malformed JSON", "process.stdin.resume(); process.stdout.write('nope')"],
    [
      "unsupported schema",
      "process.stdin.resume(); process.stdout.write(JSON.stringify({schemaVersion:'2',findings:[]}))",
    ],
    [
      "nonzero exit",
      "process.stdin.resume(); process.stderr.write('boom'); process.exitCode=3",
    ],
  ])("preserves deterministic findings for %s", async (_name, script) => {
    const report = await semanticReport(script);
    expect(report.findings.map((finding) => finding.code)).toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
    expect(report.status).toBe("fail");
  });

  it("bounds auditor execution time", async () => {
    const report = await semanticReport(
      "process.stdin.resume(); setTimeout(()=>{}, 10_000)",
    );
    expect(report.findings.map((finding) => finding.code)).toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
  });

  it("bounds auditor output", async () => {
    const report = await semanticReport(
      "process.stdin.resume(); process.stdout.write('x'.repeat(10_000))",
    );
    expect(report.findings.map((finding) => finding.code)).toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
  });

  it("accepts and normalizes a valid versioned finding", async () => {
    const report = await semanticReport(
      "process.stdin.resume(); process.stdout.write(JSON.stringify({schemaVersion:'1',findings:[{code:'SEMANTIC_REVIEW',severity:'info',message:'Review intent',artifactIds:[],evidence:['audited'],suggestion:'Inspect it'}]}))",
      "advisory",
    );
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SEMANTIC_REVIEW", severity: "info" }),
      ]),
    );
  });
});
