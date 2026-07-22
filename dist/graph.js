import path from "node:path";
import { createHash } from "node:crypto";
import { BUILTIN_ADAPTERS } from "./adapters.js";
import { readDeclaredMetadata } from "./metadata.js";
import { loadSpecGovConfig } from "./config.js";
const order = [
    "intent",
    "instruction",
    "spec",
    "plan",
    "design",
    "decision",
    "task",
    "implementation",
    "evidence",
];
export async function discoverArtifactGraph(options = {}) {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const config = options.config ??
        (await loadSpecGovConfig({ cwd, configPath: options.configPath }));
    const adapters = selectedAdapters(config);
    const artifacts = new Map();
    const changeSets = new Map();
    const detectedFrameworks = [];
    const pending = [];
    for (const adapter of adapters) {
        const context = {
            cwd,
            ignore: config.ignore,
            allowSymlinks: config.allow_symlinks,
            generic: config.generic,
        };
        const detection = await adapter.detect(context);
        if (!detection.detected)
            continue;
        detectedFrameworks.push({
            id: adapter.id,
            confidence: detection.confidence,
            roots: detection.roots.sort(),
        });
        const contribution = await adapter.discover(context);
        for (const draft of contribution.artifacts) {
            const normalized = safeRelative(cwd, draft.path);
            const metadata = await readDeclaredMetadata(path.resolve(cwd, normalized));
            const node = {
                id: stableId(adapter.id, normalized),
                path: normalized,
                role: metadata.role ?? draft.role,
                framework: adapter.id,
                changeSetId: draft.changeSetId,
                state: metadata.state ?? draft.state,
                owner: metadata.owner,
                lastVerified: metadata.lastVerified,
                scope: metadata.scope,
                producer: metadata.producer,
            };
            artifacts.set(`${adapter.id}:${normalized}`, compact(node));
            for (const relation of [
                ...(draft.relations ?? []).map((r) => ({
                    ...r,
                    source: "detected",
                })),
                ...(metadata.relations ?? []).map((r) => ({
                    ...r,
                    source: "declared",
                })),
            ])
                pending.push({
                    from: node.id,
                    targetPath: safeRelative(cwd, relation.targetPath),
                    type: relation.type,
                    source: relation.source,
                });
        }
        for (const set of contribution.changeSets)
            changeSets.set(set.id, {
                ...set,
                framework: adapter.id,
                artifactIds: [],
            });
    }
    const nodes = [...artifacts.values()];
    for (const set of changeSets.values())
        set.artifactIds = nodes
            .filter((n) => n.changeSetId === set.id)
            .map((n) => n.id)
            .sort();
    const relations = [];
    for (const set of changeSets.values()) {
        const chain = nodes
            .filter((n) => n.changeSetId === set.id)
            .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) ||
            a.path.localeCompare(b.path));
        for (let i = 1; i < chain.length; i++)
            relations.push({
                from: chain[i].id,
                to: chain[i - 1].id,
                type: chain[i].role === "evidence"
                    ? "verifies"
                    : chain[i].role === "implementation"
                        ? "implements"
                        : "derives_from",
                source: "detected",
            });
    }
    for (const relation of pending) {
        const target = nodes.find((n) => n.path === relation.targetPath);
        if (target)
            relations.push({
                from: relation.from,
                to: target.id,
                type: relation.type,
                source: relation.source,
            });
        else
            relations.push({
                from: relation.from,
                to: `missing:${relation.targetPath}`,
                type: relation.type,
                source: relation.source,
            });
    }
    return {
        schemaVersion: "1",
        repository: { root: ".", name: path.basename(cwd) },
        detectedFrameworks: detectedFrameworks.sort((a, b) => a.id.localeCompare(b.id)),
        changeSets: [...changeSets.values()].sort((a, b) => a.id.localeCompare(b.id)),
        artifacts: nodes.sort((a, b) => a.id.localeCompare(b.id)),
        relations: uniqueEdges(relations),
    };
}
function selectedAdapters(config) {
    return config.frameworks === "auto"
        ? BUILTIN_ADAPTERS
        : BUILTIN_ADAPTERS.filter((a) => config.frameworks.includes(a.id));
}
function safeRelative(cwd, input) {
    const absolute = path.resolve(cwd, input);
    const relative = path.relative(cwd, absolute).replaceAll("\\", "/");
    if (!relative ||
        relative === "." ||
        relative.startsWith("../") ||
        path.isAbsolute(relative))
        throw new Error(`Artifact path escapes repository: ${input}`);
    return relative;
}
function stableId(adapter, file) {
    return `${adapter}:${createHash("sha256").update(`${adapter}\0${file}`).digest("hex").slice(0, 16)}`;
}
function uniqueEdges(edges) {
    return [
        ...new Map(edges.map((e) => [`${e.from}|${e.to}|${e.type}|${e.source}`, e])).values(),
    ].sort((a, b) => `${a.from}|${a.to}|${a.type}`.localeCompare(`${b.from}|${b.to}|${b.type}`));
}
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}
