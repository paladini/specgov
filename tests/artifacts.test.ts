import { describe, expect, it } from "vitest";
import { buildArtifactFindings, discoverArtifacts } from "../src/artifacts.js";
import { loadConfig } from "../src/manifest.js";
import { makeTempRepo, writeBasicManifest, writeFile } from "./helpers.js";

describe("artifacts", () => {
  it("discovers artifacts and reads lifecycle frontmatter", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(
      cwd,
      "docs/auth/session.md",
      `---
status: active
owner: platform
last_verified: 2026-06-27
---
# Session Spec
`,
    );

    const config = await loadConfig(cwd);
    const discovery = await discoverArtifacts(config, cwd);

    expect(discovery.artifacts).toEqual([
      expect.objectContaining({
        path: "docs/auth/session.md",
        kind: "documentation",
        owner: "platform",
        status: "active",
      }),
    ]);
  });

  it("reports missing lifecycle status when required", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    await writeFile(cwd, "docs/auth/session.md", "# Session Spec\n");

    const config = await loadConfig(cwd);
    const discovery = await discoverArtifacts(config, cwd);
    const findings = buildArtifactFindings(config, discovery);

    expect(
      findings.some((finding) => finding.code === "LIFECYCLE_STATUS_MISSING"),
    ).toBe(true);
  });
});
