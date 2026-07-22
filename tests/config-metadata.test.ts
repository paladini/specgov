import { describe, expect, it } from "vitest";
import { loadSpecGovConfig } from "../src/index.js";
import { readDeclaredMetadata } from "../src/metadata.js";
import { makeRepo, writeFixture } from "./helpers.js";

describe("configuration and declared metadata", () => {
  it("rejects malformed YAML with its manifest path", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, ".specgov.yml", "schema: [\n");
    await expect(loadSpecGovConfig({ cwd })).rejects.toThrow(
      "Invalid YAML in .specgov.yml",
    );
  });

  it("rejects unknown v1 keys", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      ".specgov.yml",
      "schema: specgov/v1\nunknown: true\n",
    );
    await expect(loadSpecGovConfig({ cwd })).rejects.toThrow(
      "Invalid .specgov.yml",
    );
  });

  it("requires a manifest when optional is false", async () => {
    const cwd = await makeRepo();
    await expect(loadSpecGovConfig({ cwd, optional: false })).rejects.toThrow(
      "SpecGov manifest not found",
    );
  });

  it("ignores malformed and non-namespaced frontmatter", async () => {
    const cwd = await makeRepo();
    await writeFixture(cwd, "bad.md", "---\nspecgov: [\n---\n");
    await writeFixture(cwd, "other.md", "---\nowner: platform\n---\n");
    expect(await readDeclaredMetadata(`${cwd}/bad.md`)).toEqual({});
    expect(await readDeclaredMetadata(`${cwd}/other.md`)).toEqual({});
  });

  it("filters invalid declared values without rejecting the artifact", async () => {
    const cwd = await makeRepo();
    await writeFixture(
      cwd,
      "artifact.md",
      "---\nspecgov:\n  role: unknown\n  state: impossible\n  scope: [valid, 2]\n  relations:\n    - target: spec.md\n      type: unknown\n---\n",
    );
    expect(await readDeclaredMetadata(`${cwd}/artifact.md`)).toEqual({
      relations: [],
    });
  });
});
