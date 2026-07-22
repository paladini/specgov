import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { analyzeRepository } from "../src/index.js";
import { makeRepo } from "./helpers.js";

const exec = promisify(execFile);

describe("Git change discovery", () => {
  it("fails concretely when requested refs do not exist", async () => {
    const cwd = await makeRepo();
    await exec("git", ["init", "--quiet"], { cwd });
    await expect(
      analyzeRepository({
        cwd,
        baseRef: "refs/heads/missing-base",
        headRef: "refs/heads/missing-head",
      }),
    ).rejects.toThrow();
  });
});
