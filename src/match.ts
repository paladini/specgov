import picomatch from "picomatch";
import { normalizePath, toArray } from "./paths.js";

export function matchesAny(
  filePath: string,
  patterns: string | string[] | undefined,
): boolean {
  const normalizedPath = normalizePath(filePath);
  return toArray(patterns).some((pattern) => {
    const matcher = picomatch(normalizePath(pattern), { dot: true });
    return matcher(normalizedPath);
  });
}
