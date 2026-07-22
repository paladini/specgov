export function renderReport(report, format = "terminal") {
    if (format === "json")
        return `${JSON.stringify(report, null, 2)}\n`;
    return format === "markdown" ? markdown(report) : terminal(report);
}
export function renderGraph(graph, format = "json") {
    if (format === "json")
        return `${JSON.stringify(graph, null, 2)}\n`;
    const lines = [
        "# SpecGov artifact graph",
        "",
        `Frameworks: ${graph.detectedFrameworks.map((f) => f.id).join(", ") || "none"}`,
        `Change sets: ${graph.changeSets.length}`,
        `Artifacts: ${graph.artifacts.length}`,
        "",
        "## Artifacts",
        "",
    ];
    for (const a of graph.artifacts)
        lines.push(`- \`${a.id}\` — \`${a.path}\` (${a.role}, ${a.framework})`);
    lines.push("", "## Relations", "");
    for (const e of graph.relations)
        lines.push(`- \`${e.from}\` —${e.type}→ \`${e.to}\``);
    return `${lines.join("\n")}\n`;
}
export function exitCodeForReport(report) {
    return report.status === "fail" ? 1 : 0;
}
function terminal(r) {
    const lines = [
        `SpecGov ${r.status.toUpperCase()} (${r.mode})`,
        `Frameworks: ${r.graph.detectedFrameworks.map((f) => f.id).join(", ") || "none"}`,
        `Change sets: ${r.summary.changeSets} | Artifacts: ${r.summary.artifacts} | Findings: ${r.summary.findings}`,
    ];
    for (const f of r.findings.slice(0, 10))
        lines.push(`${f.severity.toUpperCase()} ${f.code}: ${f.message}\n  Next: ${f.remediation}`);
    if (r.findings.length > 10)
        lines.push(`...and ${r.findings.length - 10} more findings.`);
    return `${lines.join("\n")}\n`;
}
function markdown(r) {
    const lines = [
        "# SpecGov check",
        "",
        `**Status:** ${r.status}  `,
        `**Mode:** ${r.mode}  `,
        `**Frameworks:** ${r.graph.detectedFrameworks.map((f) => f.id).join(", ") || "none"}  `,
        `**Change sets:** ${r.summary.changeSets}  `,
        `**Artifacts:** ${r.summary.artifacts}  `,
        `**Findings:** ${r.summary.findings}`,
        "",
        "## Findings",
        "",
    ];
    if (!r.findings.length)
        lines.push("No findings.");
    for (const f of r.findings)
        lines.push(`### ${f.severity.toUpperCase()} ${f.code}`, "", f.message, "", `Evidence: ${f.evidence.join("; ") || "n/a"}`, "", `Next: ${f.remediation}`, "");
    return `${lines.join("\n")}\n`;
}
