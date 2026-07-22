import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverArtifactGraph } from "../src/index.js";
import { makeRepo, writeConfig, writeFixture } from "./helpers.js";

describe("adapters and normalized graph", () => {
  it("normalizes a mixed repository in deterministic framework order", async () => {
    const cwd = await makeRepo();
    await Promise.all([
      writeFixture(cwd, "specs/001-login/spec.md"),
      writeFixture(cwd, "specs/001-login/tasks.md"),
      writeFixture(cwd, "openspec/changes/payments/proposal.md"),
      writeFixture(cwd, "openspec/changes/payments/specs/api/spec.md"),
      writeFixture(cwd, ".kiro/specs/search/requirements.md"),
      writeFixture(cwd, ".specs/features/profile/spec.md"),
    ]);
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.detectedFrameworks.map((item) => item.id)).toEqual([
      "generic",
      "kiro",
      "openspec",
      "spec-kit",
    ]);
    expect(graph.artifacts).toHaveLength(6);
    expect(graph.artifacts.map((item) => item.id)).toEqual(
      [...graph.artifacts.map((item) => item.id)].sort(),
    );
  });

  it("honors an explicit adapter selection", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, "specs/001-login/spec.md");
    await writeFixture(cwd, ".kiro/specs/search/requirements.md");
    await writeFixture(
      cwd,
      ".specgov.yml",
      "schema: specgov/v1\nframeworks: [kiro]\n",
    );
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.detectedFrameworks.map((item) => item.id)).toEqual(["kiro"]);
    expect(graph.artifacts.every((item) => item.framework === "kiro")).toBe(
      true,
    );
  });

  it("uses configured generic roots and role patterns", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, "governance/auth/requirements.mdx");
    await writeFixture(
      cwd,
      ".specgov.yml",
      "schema: specgov/v1\nframeworks: [generic]\ngeneric:\n  roots: [governance]\n  roles:\n    - role: spec\n      patterns: [requirements.mdx]\n",
    );
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.artifacts).toMatchObject([
      { path: "governance/auth/requirements.mdx", role: "spec" },
    ]);
  });

  it("keeps graph and report payloads byte-for-byte deterministic", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, ".kiro/specs/auth/requirements.md");
    await writeFixture(cwd, ".kiro/specs/auth/design.md");
    await writeFixture(cwd, ".kiro/specs/auth/tasks.md");
    const first = JSON.stringify(await discoverArtifactGraph({ cwd }));
    const second = JSON.stringify(await discoverArtifactGraph({ cwd }));
    expect(second).toBe(first);
  });

  it("follows only repository-internal directory symlinks when enabled", async () => {
    const cwd = await makeRepo();
    const external = await makeRepo();
    await writeFixture(cwd, "internal/linked/spec.md");
    await writeFixture(external, "linked/spec.md");
    await fs.mkdir(path.join(cwd, ".specs"), { recursive: true });
    await fs.symlink(
      path.join(cwd, "internal"),
      path.join(cwd, ".specs/features"),
      "junction",
    );
    await fs.symlink(external, path.join(cwd, ".specs/external"), "junction");
    const blocked = await discoverArtifactGraph({ cwd });
    expect(blocked.artifacts).toHaveLength(0);
    await writeConfig(
      cwd,
      "allow_symlinks: true\ngeneric:\n  roots: [.specs/features, .specs/external]\n  roles: []\n",
    );
    const allowed = await discoverArtifactGraph({ cwd });
    expect(allowed.artifacts.map((item) => item.path)).toContain(
      ".specs/features/linked/spec.md",
    );
    expect(allowed.artifacts.map((item) => item.path)).not.toContain(
      ".specs/external/linked/spec.md",
    );
  });

  it("rejects repository-escaping declared relation targets", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      ".specs/features/auth/spec.md",
      "---\nspecgov:\n  relations:\n    - target: ../../../../outside.md\n      type: derives_from\n---\n",
    );
    await expect(discoverArtifactGraph({ cwd })).rejects.toThrow(
      "escapes repository",
    );
  });

  it("normalizes declared Windows relation paths", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, ".specs/features/auth/spec.md");
    await writeFixture(
      cwd,
      ".specs/features/auth/tasks.md",
      "---\nspecgov:\n  relations:\n    - target: .specs\\features\\auth\\spec.md\n      type: derives_from\n---\n# Tasks\n",
    );
    const graph = await discoverArtifactGraph({ cwd });
    expect(graph.relations.some((edge) => edge.source === "declared")).toBe(
      true,
    );
    expect(graph.relations.some((edge) => edge.to.startsWith("missing:"))).toBe(
      false,
    );
  });
});
