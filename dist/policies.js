import { createHash } from "node:crypto";
import picomatch from "picomatch";
export function runPolicies(graph, config, changedFiles = [], now = new Date()) {
    const findings = [];
    const add = (code, severity, message, paths, artifactIds, evidence, remediation, confidence = "high") => findings.push(finding(code, severity, message, paths, artifactIds, evidence, remediation, confidence));
    for (const edge of graph.relations)
        if (edge.to.startsWith("missing:"))
            add("ARTIFACT_RELATION_TARGET_MISSING", "warning", `Relation target does not exist: ${edge.to.slice(8)}`, [], [edge.from], [`${edge.type} -> ${edge.to.slice(8)}`], "Create the target artifact or correct the declared relation.");
    for (const id of cycleNodes(graph))
        add("ARTIFACT_RELATION_CYCLE", "warning", "Artifact relations contain a cycle.", [], [id], ["The artifact is part of a directed relation cycle."], "Remove or correct the circular relation.");
    for (const artifact of graph.artifacts) {
        if (artifact.state === "superseded" &&
            !graph.relations.some((e) => e.from === artifact.id && e.type === "supersedes"))
            add("ARTIFACT_SUPERSEDED_TARGET_MISSING", "warning", `${artifact.path} is superseded without a replacement.`, [artifact.path], [artifact.id], ["state=superseded"], "Declare a supersedes relation to the replacement artifact.");
        if (artifact.lastVerified && config.policies.stale_after_days > 0) {
            const age = Math.floor((now.getTime() - new Date(artifact.lastVerified).getTime()) /
                86_400_000);
            if (Number.isFinite(age) && age > config.policies.stale_after_days)
                add("ARTIFACT_STALE", "warning", `${artifact.path} was last verified ${age} days ago.`, [artifact.path], [artifact.id], [`last_verified=${artifact.lastVerified}`], "Review the artifact and update specgov.last_verified.");
        }
    }
    for (const set of graph.changeSets.filter((x) => x.state !== "archived")) {
        const nodes = graph.artifacts.filter((a) => a.changeSetId === set.id);
        const roles = new Set(nodes.map((n) => n.role));
        if (!roles.has("spec"))
            add("ACTIVE_CHANGESET_WITHOUT_SPEC", "warning", `${set.root} has no specification artifact.`, nodes.map((n) => n.path), nodes.map((n) => n.id), [`framework=${set.framework}`], "Add the framework's requirements/spec artifact.");
        const reachedPlanning = roles.has("plan") ||
            roles.has("design") ||
            roles.has("task") ||
            roles.has("implementation") ||
            roles.has("evidence");
        if (config.policies.require_complete_chain &&
            reachedPlanning &&
            !roles.has("task"))
            add("ARTIFACT_CHAIN_INCOMPLETE", "warning", `${set.root} reached planning without task artifacts.`, nodes.map((n) => n.path), nodes.map((n) => n.id), [`roles=${[...roles].sort().join(",")}`], "Add the framework task artifact or mark the change set draft.");
        const completed = nodes.some((n) => n.role === "task" &&
            (n.state === "implemented" || n.state === "verified")) ||
            set.state === "implemented" ||
            set.state === "verified";
        if (config.policies.require_verification_evidence &&
            completed &&
            !roles.has("evidence"))
            add("COMPLETED_TASK_WITHOUT_EVIDENCE", "warning", `${set.root} claims completion without verification evidence.`, nodes.map((n) => n.path), nodes.map((n) => n.id), ["completed state and no evidence role"], "Add a verification/evidence artifact.");
    }
    const artifactIdsWithEdges = new Set(graph.relations.flatMap((e) => [e.from, e.to]));
    for (const artifact of graph.artifacts)
        if (graph.artifacts.length > 1 &&
            !artifact.changeSetId &&
            !artifactIdsWithEdges.has(artifact.id))
            add("ARTIFACT_ORPHANED", "info", `${artifact.path} is not connected to a change set or relation.`, [artifact.path], [artifact.id], ["no changeSetId or relation"], "Declare a relationship or configure the proper adapter.", "medium");
    for (const domain of config.domains) {
        const codeChanged = changedFiles.filter((f) => matches(f, domain.code));
        if (!codeChanged.length)
            continue;
        const governed = graph.artifacts.filter((a) => matches(a.path, domain.artifacts));
        if (!governed.length)
            add("DOMAIN_MAPPING_MISSING", "warning", `Domain ${domain.id} has no discovered governing artifacts.`, domain.artifacts, [], [`code changed: ${codeChanged.join(", ")}`], "Correct the domain artifact patterns or add its governing artifacts.");
        else if (config.policies.require_change_artifact_for_code &&
            !changedFiles.some((f) => matches(f, domain.artifacts)))
            add("GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE", "warning", `Code changed in ${domain.id} without a governing artifact change.`, codeChanged, governed.map((a) => a.id), [
                `domain=${domain.id}`,
                `artifact patterns=${domain.artifacts.join(",")}`,
            ], "Update a governing artifact in this domain or explain why the mapping should change.");
    }
    if (config.policies.require_change_artifact_for_code &&
        !config.domains.length &&
        changedFiles.some(isImplementation))
        add("IMPLEMENTATION_WITHOUT_GOVERNING_ARTIFACT", "info", "Implementation changed but no explicit domain can identify its governing artifact.", changedFiles.filter(isImplementation), [], ["domains is empty"], "Add an explicit domains mapping for strict code-to-artifact governance.", "low");
    return [...new Map(findings.map((f) => [f.id, f])).values()].sort((a, b) => `${severityRank(a.severity)}|${a.code}|${a.id}`.localeCompare(`${severityRank(b.severity)}|${b.code}|${b.id}`));
}
function finding(code, severity, message, paths, artifactIds, evidence, remediation, confidence) {
    const sortedPaths = [...new Set(paths)].sort();
    const sortedIds = [...new Set(artifactIds)].sort();
    return {
        id: `${code.toLowerCase()}:${createHash("sha256")
            .update(`${code}\0${sortedPaths.join("\0")}\0${sortedIds.join("\0")}`)
            .digest("hex")
            .slice(0, 12)}`,
        code,
        severity,
        message,
        paths: sortedPaths,
        artifactIds: sortedIds,
        evidence,
        remediation,
        confidence,
    };
}
function matches(file, patterns) {
    return picomatch(patterns, { dot: true })(file);
}
function isImplementation(file) {
    return /^(src|app|lib|packages)\//.test(file) && !/\.(md|mdx)$/.test(file);
}
function severityRank(value) {
    return value === "error" ? "0" : value === "warning" ? "1" : "2";
}
function cycleNodes(graph) {
    const edges = new Map();
    for (const e of graph.relations)
        if (!e.to.startsWith("missing:"))
            edges.set(e.from, [...(edges.get(e.from) ?? []), e.to]);
    const seen = new Set(), stack = new Set(), cycles = new Set();
    const visit = (id) => {
        if (stack.has(id)) {
            cycles.add(id);
            return;
        }
        if (seen.has(id))
            return;
        seen.add(id);
        stack.add(id);
        for (const next of edges.get(id) ?? []) {
            if (stack.has(next)) {
                cycles.add(id);
                cycles.add(next);
            }
            else
                visit(next);
        }
        stack.delete(id);
    };
    for (const n of graph.artifacts)
        visit(n.id);
    return cycles;
}
