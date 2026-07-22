import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");

describe("package and CLI smoke", () => {
  it("builds the public library, CLI, and bundled action", async () => {
    await exec(
      process.execPath,
      ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"],
      {
        cwd: root,
      },
    );
    await expect(
      fs.access(path.join(root, "dist/index.js")),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(root, "dist/cli.js")),
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(root, "dist/action/index.js")),
    ).resolves.toBeUndefined();
  }, 20_000);

  it("runs the compiled CLI help contract", async () => {
    const { stdout } = await exec(process.execPath, ["dist/cli.js", "--help"], {
      cwd: root,
    });
    expect(stdout).toContain("init");
    expect(stdout).toContain("check");
    expect(stdout).toContain("graph");
  });

  it("reports the canonical package version", async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(root, "package.json"), "utf8"),
    ) as { version: string };
    const { stdout } = await exec(
      process.execPath,
      ["dist/cli.js", "--version"],
      {
        cwd: root,
      },
    );
    expect(stdout.trim()).toBe(packageJson.version);
  });

  it("includes required release files in the npm tarball manifest", async () => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("npm_execpath is required for package smoke");
    const { stdout } = await exec(
      process.execPath,
      [npmCli, "pack", "--dry-run", "--json", "--ignore-scripts"],
      {
        cwd: root,
        maxBuffer: 5_000_000,
      },
    );
    const [manifest] = JSON.parse(stdout) as Array<{
      files: Array<{ path: string }>;
    }>;
    const files = manifest!.files.map((entry) => entry.path);
    expect(files).toEqual(
      expect.arrayContaining([
        "package.json",
        "dist/index.js",
        "dist/index.d.ts",
        "dist/cli.js",
        "dist/action/index.js",
        "action.yml",
        "README.md",
        "LICENSE",
      ]),
    );
  });

  it("installs the tarball offline and runs the public API and CLI", async () => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("npm_execpath is required for package smoke");

    const temporaryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "specgov package smoke "),
    );
    const packageDirectory = path.join(temporaryRoot, "package");
    const consumerDirectory = path.join(temporaryRoot, "consumer with spaces");
    await fs.mkdir(packageDirectory);
    await fs.mkdir(consumerDirectory);

    try {
      const { stdout } = await exec(
        process.execPath,
        [
          npmCli,
          "pack",
          "--json",
          "--ignore-scripts",
          "--pack-destination",
          packageDirectory,
        ],
        { cwd: root, maxBuffer: 5_000_000 },
      );
      const [packed] = JSON.parse(stdout) as Array<{ filename: string }>;
      if (!packed) throw new Error("npm pack did not return a tarball");
      const tarball = path.join(packageDirectory, packed.filename);

      await fs.writeFile(
        path.join(consumerDirectory, "package.json"),
        '{"name":"specgov-package-consumer","private":true,"type":"module"}\n',
      );
      await exec(
        process.execPath,
        [
          npmCli,
          "install",
          tarball,
          "--offline",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
        ],
        { cwd: consumerDirectory, maxBuffer: 5_000_000 },
      );

      const cli = path.join(
        consumerDirectory,
        "node_modules",
        "specgov",
        "dist",
        "cli.js",
      );
      const imported = await exec(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          "import('specgov').then(m => { if (typeof m.discoverArtifactGraph !== 'function') process.exit(1) })",
        ],
        { cwd: consumerDirectory },
      );
      expect(imported.stderr).toBe("");

      const initialized = await exec(
        process.execPath,
        [cli, "init", "--dry-run"],
        { cwd: consumerDirectory },
      );
      expect(initialized.stdout).toContain("schema: specgov/v1");
      await fs.writeFile(
        path.join(consumerDirectory, ".specgov.yml"),
        "schema: specgov/v1\nmode: advisory\nframeworks: auto\n",
      );
      const checked = await exec(
        process.execPath,
        [cli, "check", "--changed-file", "README.md", "--format", "json"],
        { cwd: consumerDirectory },
      );
      expect(JSON.parse(checked.stdout)).toMatchObject({
        schemaVersion: "1",
        status: expect.any(String),
      });
      const graphed = await exec(process.execPath, [cli, "graph"], {
        cwd: consumerDirectory,
      });
      expect(JSON.parse(graphed.stdout)).toMatchObject({ schemaVersion: "1" });
    } finally {
      await fs.rm(temporaryRoot, { recursive: true, force: true });
    }
  }, 60_000);
});
