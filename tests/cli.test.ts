import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli-app.js";
import {
  makeTempRepo,
  readJson,
  writeBasicManifest,
  writeFile,
} from "./helpers.js";

describe("cli", () => {
  it("creates a default manifest", async () => {
    const cwd = await makeTempRepo();
    const output: string[] = [];
    const code = await runCli(["init"], cwd, {
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text),
    });

    expect(code).toBe(0);
    expect(output.join("")).toContain("Created .specgov.yml");
  });

  it("prints scan JSON", async () => {
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
    const output: string[] = [];
    const code = await runCli(["scan", "--format", "json"], cwd, {
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text),
    });

    expect(code).toBe(0);
    expect(JSON.parse(output.join("")).command).toBe("scan");
  });

  it("writes trace output", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    const output: string[] = [];
    const code = await runCli(["trace", "--out", ".specgov.trace.json"], cwd, {
      stdout: (text) => output.push(text),
      stderr: (text) => output.push(text),
    });

    expect(code).toBe(0);
    expect(output.join("")).toContain("Wrote .specgov.trace.json");
    const trace = await readJson(cwd, ".specgov.trace.json");
    expect(trace).toEqual(expect.objectContaining({ artifacts: [] }));
  });

  it("returns exit code 1 for strict PR failures", async () => {
    const cwd = await makeTempRepo();
    await writeBasicManifest(cwd);
    const output: string[] = [];
    const code = await runCli(
      ["check-pr", "--mode", "strict", "--changed-file", "src/auth/session.ts"],
      cwd,
      {
        stdout: (text) => output.push(text),
        stderr: (text) => output.push(text),
      },
    );

    expect(code).toBe(1);
    expect(output.join("")).toContain("SPEC_IMPACT_MISSING");
  });
});
