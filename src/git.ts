import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizePath } from "./paths.js";

const execFileAsync = promisify(execFile);

export interface ChangedFileOptions {
  cwd: string;
  baseRef?: string;
  headRef?: string;
  explicitFiles?: string[];
}

export async function getChangedFiles(
  options: ChangedFileOptions,
): Promise<string[]> {
  if (options.explicitFiles && options.explicitFiles.length > 0) {
    return uniqueNormalized(options.explicitFiles);
  }

  if (options.baseRef && options.headRef) {
    const { stdout } = await execFileAsync(
      "git",
      [
        "diff",
        "--name-only",
        "--diff-filter=ACMRTUXB",
        `${options.baseRef}...${options.headRef}`,
      ],
      {
        cwd: options.cwd,
      },
    );
    return lines(stdout);
  }

  const staged = await gitLines(options.cwd, [
    "diff",
    "--name-only",
    "--cached",
    "--diff-filter=ACMRTUXB",
  ]);
  const unstaged = await gitLines(options.cwd, [
    "diff",
    "--name-only",
    "--diff-filter=ACMRTUXB",
  ]);
  const untracked = await gitLines(options.cwd, [
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  return uniqueNormalized([...staged, ...unstaged, ...untracked]);
}

async function gitLines(cwd: string, args: string[]): Promise<string[]> {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return lines(stdout);
}

function lines(text: string): string[] {
  return uniqueNormalized(text.split(/\r?\n/).filter(Boolean));
}

function uniqueNormalized(files: string[]): string[] {
  return [...new Set(files.map(normalizePath))].sort();
}
