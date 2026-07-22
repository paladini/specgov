import fs from "node:fs/promises";
import path from "node:path";
import { SpecGovError } from "./errors.js";

export function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function relativeToCwd(cwd: string, filePath: string): string {
  return normalizePath(path.relative(cwd, filePath));
}

export function repositoryRelativePath(cwd: string, input: string): string {
  if (path.isAbsolute(input)) throw unsafePath(input);
  const relative = relativeToCwd(cwd, path.resolve(cwd, input));
  if (
    !relative ||
    relative === "." ||
    relative === ".." ||
    relative.startsWith("../") ||
    path.isAbsolute(relative)
  )
    throw unsafePath(input);
  return relative;
}

export async function resolveRepositoryPath(
  cwd: string,
  input: string,
): Promise<string> {
  const relative = repositoryRelativePath(cwd, input);
  const root = await fs.realpath(cwd);
  const target = path.resolve(cwd, relative);
  let existing = target;
  const missing: string[] = [];
  while (true) {
    try {
      existing = await fs.realpath(existing);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(existing);
      if (parent === existing) throw unsafePath(input);
      missing.unshift(path.basename(existing));
      existing = parent;
    }
  }
  const resolved = path.resolve(existing, ...missing);
  const fromRoot = path.relative(root, resolved);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(fromRoot)
  )
    throw unsafePath(input);
  return resolved;
}

function unsafePath(input: string): SpecGovError {
  return new SpecGovError(
    `Path must stay within repository and be repository-relative: ${input}`,
  );
}

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
