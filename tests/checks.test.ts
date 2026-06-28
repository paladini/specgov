import { describe, expect, it } from "vitest";
import { runCheckPr, runDrift, runTrace } from "../src/checks.js";
import { loadConfig } from "../src/manifest.js";
import { makeTempRepo, writeBasicManifest, writeFile } from "./helpers.js";

describe("checks", () => {
  it("warns when mapped code changes without a related spec change", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(
      cwd,
      "docs/auth/session.md",
      `---
status: active
owner: docs
last_verified: 2026-06-27
---
# Session
`,
    );

    const config = await loadConfig(cwd);
    const report = await runCheckPr({
      cwd,
      config,
      changedFiles: ["src/auth/session.ts"],
    });

    expect(report.status).toBe("warn");
    expect(
      report.findings.some((finding) => finding.code === "SPEC_IMPACT_MISSING"),
    ).toBe(true);
  });

  it("does not warn for missing impact when a related spec changed", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(
      cwd,
      "docs/auth/session.md",
      `---
status: active
owner: docs
last_verified: 2026-06-27
---
# Session
`,
    );

    const config = await loadConfig(cwd);
    const report = await runCheckPr({
      cwd,
      config,
      changedFiles: ["src/auth/session.ts", "docs/auth/session.md"],
    });

    expect(
      report.findings.some((finding) => finding.code === "SPEC_IMPACT_MISSING"),
    ).toBe(false);
  });

  it("fails in strict mode when governance warnings exist", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    const config = await loadConfig(cwd);
    const report = await runCheckPr({
      cwd,
      config,
      mode: "strict",
      changedFiles: ["src/auth/session.ts"],
    });

    expect(report.status).toBe("fail");
  });

  it("generates a trace index", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(
      cwd,
      "docs/auth/session.md",
      `---
status: active
owner: docs
last_verified: 2026-06-27
---
# Session
`,
    );

    const config = await loadConfig(cwd);
    const trace = await runTrace({ cwd, config });

    expect(trace.artifacts).toHaveLength(1);
    expect(trace.mappings[0]?.matchedArtifacts).toEqual([
      "docs/auth/session.md",
    ]);
  });

  it("reports orphan artifacts in drift", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(
      cwd,
      "adr/cache.md",
      `---
status: active
owner: architecture
last_verified: 2026-06-27
---
# Cache ADR
`,
    );

    const config = await loadConfig(cwd);
    const report = await runDrift({ cwd, config });

    expect(
      report.findings.some((finding) => finding.code === "ARTIFACT_ORPHANED"),
    ).toBe(true);
  });
});
