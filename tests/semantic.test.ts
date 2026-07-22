import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeRepository, loadSpecGovConfig } from "../src/index.js";
import { makeRepo, writeFixture } from "./helpers.js";

async function semanticReport(
  script: string,
  mode: "advisory" | "strict" = "strict",
  timeoutMs = 4_000,
) {
  const cwd = await makeRepo();
  await writeFixture(cwd, "auditor.mjs", script);
  const config = await loadSpecGovConfig({ cwd });
  config.mode = mode;
  config.semantic = {
    enabled: true,
    command: [process.execPath, `${cwd}/auditor.mjs`],
    timeout_ms: timeoutMs,
    max_output_bytes: 1_000,
    failure_policy: "fail",
  };
  return analyzeRepository({ cwd, config, changedFiles: [] });
}

describe("semantic auditor failure isolation", () => {
  it.each([
    [
      "malformed JSON",
      "process.stdin.on('end',()=>process.stdout.write('nope')); process.stdin.resume()",
    ],
    [
      "unsupported schema",
      "process.stdin.on('end',()=>process.stdout.write(JSON.stringify({schemaVersion:'2',findings:[]}))); process.stdin.resume()",
    ],
    [
      "nonzero exit",
      "process.stdin.on('end',()=>{process.stderr.write('boom'); process.exitCode=3}); process.stdin.resume()",
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
      "strict",
      200,
    );
    expect(report.findings.map((finding) => finding.code)).toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
  });

  it("bounds auditor output", async () => {
    const report = await semanticReport(
      "process.stdin.on('end',()=>process.stdout.write('x'.repeat(10_000))); process.stdin.resume()",
    );
    expect(report.findings.map((finding) => finding.code)).toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
  });

  it("rejects oversized input before starting the auditor", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      "auditor.mjs",
      "await import('node:fs/promises').then(fs => fs.writeFile('started', 'yes')); process.stdin.resume()",
    );
    const config = await loadSpecGovConfig({ cwd });
    config.semantic = {
      enabled: true,
      command: [process.execPath, path.join(cwd, "auditor.mjs")],
      timeout_ms: 10_000,
      max_output_bytes: 1_000,
      failure_policy: "fail",
    };

    const report = await analyzeRepository({
      cwd,
      config,
      changedFiles: [`src/${"x".repeat(1_000_000)}.ts`],
    });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SEMANTIC_AUDITOR_FAILED",
          message: expect.stringContaining("input exceeds 1000000 bytes"),
        }),
      ]),
    );
    await expect(fs.access(path.join(cwd, "started"))).rejects.toThrow();
  });

  it("runs the auditor from the analyzed repository root", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      "auditor.mjs",
      "process.stdin.on('end',()=>process.stdout.write(JSON.stringify({schemaVersion:'1',findings:[{code:'AUDITOR_CWD',message:process.cwd()}]}))); process.stdin.resume()",
    );
    const config = await loadSpecGovConfig({ cwd });
    config.mode = "advisory";
    config.semantic = {
      enabled: true,
      command: [process.execPath, path.join(cwd, "auditor.mjs")],
      timeout_ms: 10_000,
      max_output_bytes: 1_000,
      failure_policy: "fail",
    };

    const report = await analyzeRepository({ cwd, config, changedFiles: [] });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "AUDITOR_CWD", message: cwd }),
      ]),
    );
  });

  it("accepts and normalizes a valid versioned finding", async () => {
    const report = await semanticReport(
      "process.stdin.on('end',()=>process.stdout.write(JSON.stringify({schemaVersion:'1',findings:[{code:'SEMANTIC_REVIEW',severity:'info',message:'Review intent',artifactIds:[],evidence:['audited'],suggestion:'Inspect it'}]}))); process.stdin.resume()",
      "advisory",
    );
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SEMANTIC_REVIEW", severity: "info" }),
      ]),
    );
  });
});
