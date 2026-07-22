import { performance } from "node:perf_hooks";
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverArtifactGraph } from "../src/index.js";
import { makeRepo, writeFixture } from "./helpers.js";

const CHANGE_SET_COUNT = 500;
const ARTIFACTS_PER_CHANGE_SET = 3;
const PERFORMANCE_BUDGET_MS = 15_000;

describe("performance budget", () => {
  let cwd: string | undefined;

  afterEach(async () => {
    if (cwd) await fs.rm(cwd, { recursive: true, force: true });
  });

  it("discovers a deterministic 1,500-artifact corpus within budget", async () => {
    cwd = await makeRepo();
    await writeFixture(
      cwd,
      ".specgov.yml",
      [
        "schema: specgov/v1",
        "mode: advisory",
        "frameworks: [generic]",
        "generic:",
        "  roots: [.specs/features]",
        "  roles:",
        "    - role: spec",
        "      patterns: ['**/spec.md']",
        "    - role: design",
        "      patterns: ['**/design.md']",
        "    - role: task",
        "      patterns: ['**/tasks.md']",
      ].join("\n"),
    );
    const files = Array.from({ length: CHANGE_SET_COUNT }, (_, index) => {
      const changeSet = `change-${index.toString().padStart(4, "0")}`;
      return ["spec.md", "design.md", "tasks.md"].map((name) =>
        writeFixture(
          cwd!,
          path.join(".specs", "features", changeSet, name),
          `# ${changeSet} ${name}\n`,
        ),
      );
    }).flat();
    await Promise.all(files);

    const started = performance.now();
    const graph = await discoverArtifactGraph({ cwd });
    const elapsedMs = performance.now() - started;

    expect(graph.artifacts).toHaveLength(
      CHANGE_SET_COUNT * ARTIFACTS_PER_CHANGE_SET,
    );
    expect(graph.changeSets).toHaveLength(CHANGE_SET_COUNT);
    expect(JSON.stringify(graph)).toBe(
      JSON.stringify(await discoverArtifactGraph({ cwd })),
    );
    expect(elapsedMs).toBeLessThan(PERFORMANCE_BUDGET_MS);
  }, 30_000);
});
