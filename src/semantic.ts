import { execFile } from "node:child_process";
import type { Finding, SemanticConfig, SpecGovReport } from "./types.js";
import { createHash } from "node:crypto";

const MAX_INPUT_BYTES = 1_000_000;

export async function runSemanticAuditor(
  report: SpecGovReport,
  config: SemanticConfig,
  cwd: string,
): Promise<Finding[]> {
  if (!config.command?.length)
    throw new Error(
      "Semantic auditing is enabled but semantic.command is missing.",
    );
  const [file, ...args] = config.command;
  const input = JSON.stringify({
    schemaVersion: "1",
    graph: report.graph,
    changedFiles: report.changedFiles,
    deterministicFindings: report.findings,
  });
  const inputBytes = Buffer.byteLength(input, "utf8");
  if (inputBytes > MAX_INPUT_BYTES)
    throw new Error(
      `Semantic auditor input exceeds ${MAX_INPUT_BYTES} bytes (${inputBytes} bytes).`,
    );
  const output = await new Promise<string>((resolve, reject) => {
    const child = execFile(
      file!,
      args,
      {
        cwd,
        timeout: config.timeout_ms,
        maxBuffer: config.max_output_bytes,
        windowsHide: true,
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
      },
      (error, stdout, stderr) =>
        error
          ? reject(
              new Error(
                `Semantic auditor failed: ${error.message}${stderr ? ` (${stderr.trim()})` : ""}`,
              ),
            )
          : resolve(stdout),
    );
    child.stdin?.end(input);
  });
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    throw new Error("Semantic auditor returned malformed JSON.");
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { schemaVersion?: unknown }).schemaVersion !== "1" ||
    !Array.isArray((parsed as { findings?: unknown }).findings)
  )
    throw new Error("Semantic auditor returned an unsupported schema.");
  return (parsed as { findings: Array<Record<string, unknown>> }).findings.map(
    (raw, index) => {
      if (typeof raw.code !== "string" || typeof raw.message !== "string")
        throw new Error(`Semantic finding ${index} is invalid.`);
      const artifactIds = Array.isArray(raw.artifactIds)
        ? raw.artifactIds.filter((x): x is string => typeof x === "string")
        : [];
      return {
        id: `${raw.code.toLowerCase()}:${createHash("sha256")
          .update(`${raw.code}\0${raw.message}\0${artifactIds.join("\0")}`)
          .digest("hex")
          .slice(0, 12)}`,
        code: raw.code,
        severity:
          raw.severity === "error"
            ? "error"
            : raw.severity === "info"
              ? "info"
              : "warning",
        message: raw.message,
        paths: [],
        artifactIds,
        evidence: Array.isArray(raw.evidence)
          ? raw.evidence.filter((x): x is string => typeof x === "string")
          : [],
        remediation:
          typeof raw.suggestion === "string"
            ? raw.suggestion
            : "Review the semantic finding.",
        confidence: "medium",
      };
    },
  );
}
