import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeRepository,
  discoverArtifactGraph,
  loadSpecGovConfig,
  renderReport,
} from "../src/index.js";
import { runCli } from "../src/cli-app.js";

async function repo(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "specgov-v1-"));
}
async function write(
  cwd: string,
  file: string,
  text = "# test\n",
): Promise<void> {
  const target = path.join(cwd, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, text, "utf8");
}
async function config(cwd: string, extra = ""): Promise<void> {
  await write(
    cwd,
    ".specgov.yml",
    `schema: specgov/v1\nmode: advisory\nframeworks: auto\n${extra}`,
  );
}

describe("SpecGov v1", () => {
  it("loads defaults without configuration", async () => {
    const cwd = await repo();
    const value = await loadSpecGovConfig({ cwd });
    expect(value.schema).toBe("specgov/v1");
    expect(value.mode).toBe("advisory");
  });
  it("rejects the legacy manifest", async () => {
    const cwd = await repo();
    await write(
      cwd,
      ".specgov.yml",
      "version: 1\nartifacts: []\nmappings: []\n",
    );
    await expect(loadSpecGovConfig({ cwd })).rejects.toThrow(
      "LEGACY_MANIFEST_UNSUPPORTED",
    );
  });
  it("autodetects Spec Kit and builds a stable chain", async () => {
    const cwd = await repo();
    await write(cwd, ".specify/memory/constitution.md");
    await write(cwd, "specs/001-auth/spec.md");
    await write(cwd, "specs/001-auth/plan.md");
    await write(cwd, "specs/001-auth/tasks.md");
    const a = await discoverArtifactGraph({ cwd });
    const b = await discoverArtifactGraph({ cwd });
    expect(a).toEqual(b);
    expect(a.detectedFrameworks.map((x) => x.id)).toContain("spec-kit");
    expect(a.relations.length).toBeGreaterThan(0);
  });
  it("autodetects OpenSpec active and archived changes", async () => {
    const cwd = await repo();
    await write(cwd, "openspec/config.yaml");
    await write(cwd, "openspec/changes/add-auth/proposal.md");
    await write(cwd, "openspec/changes/add-auth/specs/auth/spec.md");
    await write(cwd, "openspec/changes/archive/2026-07-22-old/proposal.md");
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.detectedFrameworks.map((x) => x.id)).toContain("openspec");
    expect(graph.changeSets.some((x) => x.state === "archived")).toBe(true);
  });
  it("autodetects Kiro requirements, design, tasks, and steering", async () => {
    const cwd = await repo();
    await write(cwd, ".kiro/specs/auth/requirements.md");
    await write(cwd, ".kiro/specs/auth/design.md");
    await write(cwd, ".kiro/specs/auth/tasks.md");
    await write(cwd, ".kiro/steering/product.md");
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.artifacts.map((x) => x.role)).toEqual(
      expect.arrayContaining(["spec", "design", "task", "instruction"]),
    );
  });
  it("autodetects Generic TLC conservatively", async () => {
    const cwd = await repo();
    await write(cwd, ".specs/features/auth/spec.md");
    await write(cwd, ".specs/features/auth/design.md");
    await write(cwd, ".specs/features/auth/tasks.md");
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.detectedFrameworks.map((x) => x.id)).toContain("generic");
  });
  it("parses namespaced declared metadata", async () => {
    const cwd = await repo();
    await write(
      cwd,
      ".specs/features/auth/spec.md",
      `---\nspecgov:\n  state: verified\n  owner: platform\n  scope: ["src/auth/**"]\n  producer:\n    tool: codex\n    model: gpt-5\n---\n# Auth\n`,
    );
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.artifacts[0]).toMatchObject({
      state: "verified",
      owner: "platform",
      scope: ["src/auth/**"],
      producer: { tool: "codex", model: "gpt-5" },
    });
  });
  it("does not let an unrelated spec satisfy an explicit domain", async () => {
    const cwd = await repo();
    await write(cwd, ".kiro/specs/auth/requirements.md");
    await config(
      cwd,
      `domains:\n  - id: auth\n    code: ["src/auth/**"]\n    artifacts: [".kiro/specs/auth/**"]\n`,
    );
    const report = await analyzeRepository({
      cwd,
      changedFiles: [
        "src/auth/session.ts",
        ".kiro/specs/payments/requirements.md",
      ],
    });
    expect(report.findings.map((x) => x.code)).toContain(
      "GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE",
    );
  });
  it("accepts the mapped artifact change", async () => {
    const cwd = await repo();
    await write(cwd, ".kiro/specs/auth/requirements.md");
    await config(
      cwd,
      `domains:\n  - id: auth\n    code: ["src/auth/**"]\n    artifacts: [".kiro/specs/auth/**"]\n`,
    );
    const report = await analyzeRepository({
      cwd,
      changedFiles: ["src/auth/session.ts", ".kiro/specs/auth/requirements.md"],
    });
    expect(report.findings.map((x) => x.code)).not.toContain(
      "GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE",
    );
  });
  it("uses advisory and strict exit behavior", async () => {
    const cwd = await repo();
    await write(cwd, ".kiro/specs/auth/requirements.md");
    await write(cwd, ".kiro/specs/auth/design.md");
    const advisory = await analyzeRepository({
      cwd,
      changedFiles: [],
      mode: "advisory",
    });
    const strict = await analyzeRepository({
      cwd,
      changedFiles: [],
      mode: "strict",
    });
    expect(advisory.status).toBe("warn");
    expect(strict.status).toBe("fail");
  });
  it("renders terminal, markdown, and stable JSON", async () => {
    const cwd = await repo();
    const report = await analyzeRepository({ cwd, changedFiles: [] });
    expect(renderReport(report, "terminal")).toContain("SpecGov");
    expect(renderReport(report, "markdown")).toContain("# SpecGov check");
    expect(JSON.parse(renderReport(report, "json")).schemaVersion).toBe("1");
  });
  it("exposes only the clean CLI commands", async () => {
    const cwd = await repo();
    let out = "",
      err = "";
    const code = await runCli(["--help"], cwd, {
      stdout: (x) => (out += x),
      stderr: (x) => (err += x),
    });
    expect(code).toBe(0);
    expect(out).toContain("check");
    expect(out).toContain("graph");
    expect(out).not.toContain("check-pr");
    expect(err).toBe("");
  });
  it("previews init without writing", async () => {
    const cwd = await repo();
    let out = "";
    expect(
      await runCli(["init", "--dry-run"], cwd, {
        stdout: (x) => (out += x),
        stderr: () => {},
      }),
    ).toBe(0);
    expect(out).toContain("schema: specgov/v1");
    await expect(fs.access(path.join(cwd, ".specgov.yml"))).rejects.toThrow();
  });
  it("writes init only with explicit yes in noninteractive use", async () => {
    const cwd = await repo();
    expect(
      await runCli(["init", "--yes"], cwd, {
        stdout: () => {},
        stderr: () => {},
      }),
    ).toBe(0);
    expect(await fs.readFile(path.join(cwd, ".specgov.yml"), "utf8")).toContain(
      "schema: specgov/v1",
    );
  });
  it("runs the provider-independent semantic protocol", async () => {
    const cwd = await repo();
    const semanticConfig = await loadSpecGovConfig({ cwd });
    semanticConfig.semantic = {
      enabled: true,
      command: [
        process.execPath,
        path.resolve("tools/specgov-semantic-auditor.mjs"),
      ],
      timeout_ms: 5_000,
      max_output_bytes: 100_000,
      failure_policy: "fail",
    };
    const report = await analyzeRepository({
      cwd,
      config: semanticConfig,
      changedFiles: [],
    });
    expect(report.findings.map((finding) => finding.code)).not.toContain(
      "SEMANTIC_AUDITOR_FAILED",
    );
  });
});
