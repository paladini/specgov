import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizePath } from "./paths.js";
const execFileAsync = promisify(execFile);
export async function getChangedFiles(options) {
    if (options.explicitFiles && options.explicitFiles.length > 0) {
        return uniqueNormalized(options.explicitFiles);
    }
    if (options.baseRef && options.headRef) {
        const { stdout } = await execFileAsync("git", [
            "diff",
            "--name-only",
            "--diff-filter=ACMRTUXB",
            `${options.baseRef}...${options.headRef}`,
        ], {
            cwd: options.cwd,
        });
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
async function gitLines(cwd, args) {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return lines(stdout);
}
function lines(text) {
    return uniqueNormalized(text.split(/\r?\n/).filter(Boolean));
}
function uniqueNormalized(files) {
    return [...new Set(files.map(normalizePath))].sort();
}
