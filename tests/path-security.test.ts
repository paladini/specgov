import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSpecGovConfig } from "../src/index.js";
import { runCli } from "../src/cli-app.js";
import { makeRepo, writeFixture } from "./helpers.js";

const io = () => ({ stdout: () => {}, stderr: () => {} });

describe("repository path security", () => {
  it.each(["../outside.yml", path.resolve(os.tmpdir(), "outside.yml")])(
    "rejects an unsafe config path: %s",
    async (configPath) => {
      const cwd = await makeRepo();
      await expect(loadSpecGovConfig({ cwd, configPath })).rejects.toThrow(
        "must stay within repository",
      );
    },
  );

  it.each(["../graph.json", path.resolve(os.tmpdir(), "graph.json")])(
    "does not write graph output outside the repository: %s",
    async (outputPath) => {
      const cwd = await makeRepo();
      expect(await runCli(["graph", "--out", outputPath], cwd, io())).toBe(2);
    },
  );

  it("rejects graph output through an external directory symlink", async () => {
    const cwd = await makeRepo();
    const external = await fs.mkdtemp(path.join(os.tmpdir(), "specgov-out-"));
    await fs.symlink(external, path.join(cwd, "linked"), "junction");
    expect(
      await runCli(["graph", "--out", "linked/graph.json"], cwd, io()),
    ).toBe(2);
    await expect(
      fs.access(path.join(external, "graph.json")),
    ).rejects.toThrow();
  });

  it("allows graph output through an internal directory symlink", async () => {
    const cwd = await makeRepo();
    await fs.mkdir(path.join(cwd, "output"));
    await fs.symlink(
      path.join(cwd, "output"),
      path.join(cwd, "linked"),
      "junction",
    );
    expect(
      await runCli(["graph", "--out", "linked/graph.json"], cwd, io()),
    ).toBe(0);
    await expect(
      fs.access(path.join(cwd, "output", "graph.json")),
    ).resolves.toBeUndefined();
  });

  it("rejects a config file reached through an external symlink", async () => {
    const cwd = await makeRepo();
    const external = await makeRepo();
    await writeFixture(external, "config.yml", "schema: specgov/v1\n");
    await fs.symlink(external, path.join(cwd, "linked"), "junction");
    await expect(
      loadSpecGovConfig({ cwd, configPath: "linked/config.yml" }),
    ).rejects.toThrow("must stay within repository");
  });
});
