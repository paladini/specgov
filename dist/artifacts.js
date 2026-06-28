import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parse } from "yaml";
import { matchesAny } from "./match.js";
import { normalizePath, toArray } from "./paths.js";
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const STATUS_VALUES = [
    "draft",
    "active",
    "superseded",
    "deprecated",
    "archived",
];
export async function discoverArtifacts(config, cwd) {
    const artifactsByPath = new Map();
    const ruleMatchCounts = [];
    for (const rule of config.artifacts) {
        const entries = await fg(toArray(rule.path), {
            cwd,
            onlyFiles: true,
            dot: true,
            ignore: config.ignore,
        });
        ruleMatchCounts.push({
            path: rule.path,
            kind: rule.kind,
            count: entries.length,
        });
        for (const entry of entries) {
            const relativePath = normalizePath(entry);
            if (artifactsByPath.has(relativePath)) {
                continue;
            }
            const metadata = await readArtifactMetadata(path.resolve(cwd, entry));
            artifactsByPath.set(relativePath, {
                path: relativePath,
                kind: rule.kind,
                owner: metadata.owner ?? rule.owner,
                status: metadata.status ?? rule.status,
                lastVerified: metadata.last_verified,
                supersededBy: metadata.superseded_by,
            });
        }
    }
    return {
        artifacts: [...artifactsByPath.values()].sort((left, right) => left.path.localeCompare(right.path)),
        ruleMatchCounts,
    };
}
export async function readArtifactMetadata(filePath) {
    const text = await fs.readFile(filePath, "utf8");
    const match = text.match(FRONTMATTER);
    if (!match?.[1]) {
        return {};
    }
    const parsed = parse(match[1]);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }
    const raw = parsed;
    const metadata = {};
    if (typeof raw.status === "string" &&
        STATUS_VALUES.includes(raw.status)) {
        metadata.status = raw.status;
    }
    if (typeof raw.owner === "string") {
        metadata.owner = raw.owner;
    }
    if (typeof raw.last_verified === "string") {
        metadata.last_verified = raw.last_verified;
    }
    if (typeof raw.superseded_by === "string") {
        metadata.superseded_by = raw.superseded_by;
    }
    return metadata;
}
export function buildArtifactFindings(config, discovery, now = new Date()) {
    const findings = [];
    for (const rule of discovery.ruleMatchCounts) {
        if (rule.count === 0) {
            findings.push({
                code: "ARTIFACT_GLOB_EMPTY",
                severity: "warning",
                message: `Artifact glob for ${rule.kind} matched no files.`,
                relatedFiles: toArray(rule.path),
                suggestion: "Update the glob or add the governed artifact files.",
            });
        }
    }
    for (const artifact of discovery.artifacts) {
        if (config.rules.require_lifecycle_status && !artifact.status) {
            findings.push({
                code: "LIFECYCLE_STATUS_MISSING",
                severity: "warning",
                message: `Governed artifact ${artifact.path} has no lifecycle status.`,
                file: artifact.path,
                suggestion: "Add YAML frontmatter with status: active, draft, superseded, deprecated, or archived.",
            });
        }
        if (config.rules.require_owner_for_active_specs &&
            artifact.status === "active" &&
            !artifact.owner) {
            findings.push({
                code: "ACTIVE_OWNER_MISSING",
                severity: "warning",
                message: `Active governed artifact ${artifact.path} has no owner.`,
                file: artifact.path,
                suggestion: "Add owner metadata in frontmatter or the artifact rule.",
            });
        }
        if (artifact.status === "superseded" && !artifact.supersededBy) {
            findings.push({
                code: "SUPERSEDED_TARGET_MISSING",
                severity: "warning",
                message: `Superseded artifact ${artifact.path} does not declare superseded_by.`,
                file: artifact.path,
                suggestion: "Add superseded_by metadata pointing to the replacement artifact.",
            });
        }
        if (artifact.lastVerified && config.rules.stale_after_days > 0) {
            const ageDays = daysBetween(artifact.lastVerified, now);
            if (ageDays !== undefined && ageDays > config.rules.stale_after_days) {
                findings.push({
                    code: "ARTIFACT_STALE",
                    severity: "warning",
                    message: `Governed artifact ${artifact.path} was last verified ${ageDays} days ago.`,
                    file: artifact.path,
                    suggestion: "Review the artifact and update last_verified if it still matches reality.",
                });
            }
        }
    }
    return findings;
}
export function artifactPathsMatching(artifacts, patterns) {
    return artifacts
        .filter((artifact) => matchesAny(artifact.path, patterns))
        .map((artifact) => artifact.path);
}
export function isArtifactPath(config, filePath) {
    return config.artifacts.some((rule) => matchesAny(filePath, rule.path));
}
function daysBetween(dateText, now) {
    const parsed = new Date(`${dateText}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }
    const diffMs = now.getTime() - parsed.getTime();
    return Math.floor(diffMs / 86_400_000);
}
