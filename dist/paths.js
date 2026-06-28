import path from "node:path";
export function normalizePath(input) {
    return input.replace(/\\/g, "/").replace(/^\.\//, "");
}
export function relativeToCwd(cwd, filePath) {
    return normalizePath(path.relative(cwd, filePath));
}
export function toArray(value) {
    if (!value) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
}
