import { describe, expect, it } from "vitest";
import { analyzeRepository, loadSpecGovConfig } from "../src/index.js";
import { makeRepo, writeConfig, writeFixture } from "./helpers.js";

describe("deterministic policies", () => {
  it("reports missing declared targets and relation cycles", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      ".specs/features/auth/spec.md",
      "---\nspecgov:\n  relations:\n    - target: .specs/features/auth/tasks.md\n      type: derives_from\n    - target: .specs/features/auth/missing.md\n      type: derives_from\n---\n",
    );
    await writeFixture(
      cwd,
      ".specs/features/auth/tasks.md",
      "---\nspecgov:\n  relations:\n    - target: .specs/features/auth/spec.md\n      type: derives_from\n---\n",
    );
    const report = await analyzeRepository({ cwd, changedFiles: [] });
    const codes = report.findings.map((finding) => finding.code);
    expect(codes).toContain("ARTIFACT_RELATION_TARGET_MISSING");
    expect(codes).toContain("ARTIFACT_RELATION_CYCLE");
  });

  it("ignores archived incomplete change sets", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, "openspec/changes/archive/2026-old/design.md");
    await writeFixture(cwd, "openspec/config.yaml");
    const report = await analyzeRepository({ cwd, changedFiles: [] });
    expect(report.findings.map((finding) => finding.code)).not.toContain(
      "ACTIVE_CHANGESET_WITHOUT_SPEC",
    );
  });

  it("reports stale and unsupported superseded declarations", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      ".specs/features/auth/spec.md",
      "---\nspecgov:\n  state: superseded\n  last_verified: 2020-01-01\n---\n",
    );
    const report = await analyzeRepository({
      cwd,
      changedFiles: [],
      mode: "advisory",
    });
    const codes = report.findings.map((finding) => finding.code);
    expect(codes).toContain("ARTIFACT_STALE");
    expect(codes).toContain("ARTIFACT_SUPERSEDED_TARGET_MISSING");
  });

  it("keeps code correlation informational without explicit domains", async () => {
    const cwd = await makeRepo();
    const report = await analyzeRepository({
      cwd,
      changedFiles: ["src/auth.ts"],
    });
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "IMPLEMENTATION_WITHOUT_GOVERNING_ARTIFACT",
          severity: "info",
          confidence: "low",
        }),
      ]),
    );
  });

  it("reports a domain whose artifact pattern discovers nothing", async () => {
    const cwd = await makeRepo();
    await writeConfig(
      cwd,
      "domains:\n  - id: auth\n    code: [src/auth/**]\n    artifacts: [.kiro/specs/auth/**]\n",
    );
    const config = await loadSpecGovConfig({ cwd });
    const report = await analyzeRepository({
      cwd,
      config,
      changedFiles: ["src/auth/session.ts"],
    });
    expect(report.findings.map((finding) => finding.code)).toContain(
      "DOMAIN_MAPPING_MISSING",
    );
  });
});
