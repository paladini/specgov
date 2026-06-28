import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function makeTempRepo(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "specgov-"));
}

export async function writeFile(
  cwd: string,
  filePath: string,
  content: string,
): Promise<void> {
  const absolutePath = path.join(cwd, filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
}

export async function readJson(
  cwd: string,
  filePath: string,
): Promise<unknown> {
  const text = await fs.readFile(path.join(cwd, filePath), "utf8");
  return JSON.parse(text);
}

export async function writeBasicManifest(
  cwd: string,
  extra = "",
): Promise<void> {
  await writeFile(
    cwd,
    ".specgov.yml",
    `version: 1
mode: advisory
artifacts:
  - path: "docs/**/*.md"
    kind: documentation
    owner: docs
  - path: "adr/**/*.md"
    kind: decision
    owner: architecture
mappings:
  - code: "src/auth/**"
    specs: "docs/auth/**"
rules:
  require_spec_impact_for_code_changes: true
  require_lifecycle_status: true
  require_owner_for_active_specs: true
  stale_after_days: 180
ignore:
  - "node_modules/**"
${extra}`,
  );
}
