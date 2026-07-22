import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
export async function runSemanticAuditor(report, config) {
    if (!config.command?.length)
        throw new Error("Semantic auditing is enabled but semantic.command is missing.");
    const [file, ...args] = config.command;
    const input = JSON.stringify({
        schemaVersion: "1",
        graph: report.graph,
        changedFiles: report.changedFiles,
        deterministicFindings: report.findings,
    });
    const output = await new Promise((resolve, reject) => {
        const child = execFile(file, args, {
            cwd: process.cwd(),
            timeout: config.timeout_ms,
            maxBuffer: config.max_output_bytes,
            windowsHide: true,
            env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
        }, (error, stdout, stderr) => error
            ? reject(new Error(`Semantic auditor failed: ${error.message}${stderr ? ` (${stderr.trim()})` : ""}`))
            : resolve(stdout));
        child.stdin?.end(input);
    });
    let parsed;
    try {
        parsed = JSON.parse(output);
    }
    catch {
        throw new Error("Semantic auditor returned malformed JSON.");
    }
    if (!parsed ||
        typeof parsed !== "object" ||
        parsed.schemaVersion !== "1" ||
        !Array.isArray(parsed.findings))
        throw new Error("Semantic auditor returned an unsupported schema.");
    return parsed.findings.map((raw, index) => {
        if (typeof raw.code !== "string" || typeof raw.message !== "string")
            throw new Error(`Semantic finding ${index} is invalid.`);
        const artifactIds = Array.isArray(raw.artifactIds)
            ? raw.artifactIds.filter((x) => typeof x === "string")
            : [];
        return {
            id: `${raw.code.toLowerCase()}:${createHash("sha256")
                .update(`${raw.code}\0${raw.message}\0${artifactIds.join("\0")}`)
                .digest("hex")
                .slice(0, 12)}`,
            code: raw.code,
            severity: raw.severity === "error"
                ? "error"
                : raw.severity === "info"
                    ? "info"
                    : "warning",
            message: raw.message,
            paths: [],
            artifactIds,
            evidence: Array.isArray(raw.evidence)
                ? raw.evidence.filter((x) => typeof x === "string")
                : [],
            remediation: typeof raw.suggestion === "string"
                ? raw.suggestion
                : "Review the semantic finding.",
            confidence: "medium",
        };
    });
}
