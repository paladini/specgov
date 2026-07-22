import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function makeRepo(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "specgov-test-"));
}

export async function writeFixture(
  cwd: string,
  file: string,
  text = "# fixture\n",
): Promise<void> {
  const target = path.join(cwd, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, text, "utf8");
}

export async function writeConfig(cwd: string, body = ""): Promise<void> {
  await writeFixture(
    cwd,
    ".specgov.yml",
    `schema: specgov/v1\nmode: advisory\nframeworks: auto\n${body}`,
  );
}
