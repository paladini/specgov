import { execFile } from "node:child_process";
import fs from "node:fs/promises";
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
});
