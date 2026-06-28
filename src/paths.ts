import path from "node:path";

export function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\.\//, "");
}

export function relativeToCwd(cwd: string, filePath: string): string {
  return normalizePath(path.relative(cwd, filePath));
}

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
