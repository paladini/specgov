export function evaluateStatus(findings, mode) {
    if (findings.some((finding) => finding.severity === "error")) {
        return "fail";
    }
    if (findings.some((finding) => finding.severity === "warning")) {
        return mode === "strict" ? "fail" : "warn";
    }
    return "pass";
}
export function makeReport(input) {
    const status = evaluateStatus(input.findings, input.mode);
    return {
        ...input,
        status,
        summary: {
            findings: input.findings.length,
            errors: input.findings.filter((finding) => finding.severity === "error")
                .length,
            warnings: input.findings.filter((finding) => finding.severity === "warning").length,
            infos: input.findings.filter((finding) => finding.severity === "info")
                .length,
        },
    };
}
export function exitCodeForReport(report) {
    if (report.status === "error") {
        return 2;
    }
    if (report.status === "fail") {
        return 1;
    }
    return 0;
}
export function renderReport(report, format = "markdown") {
    if (format === "json") {
        return `${JSON.stringify(report, null, 2)}\n`;
    }
    return renderMarkdownReport(report);
}
export function renderMarkdownReport(report) {
    const lines = [
        `# SpecGov ${report.command} report`,
        "",
        `Status: **${report.status}**`,
        `Mode: \`${report.mode}\``,
        `Findings: ${report.summary.findings} (${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.infos} info)`,
        "",
    ];
    if (report.changedFiles?.length) {
        lines.push("## Changed Files", "");
        for (const file of report.changedFiles) {
            lines.push(`- \`${file}\``);
        }
        lines.push("");
    }
    if (report.artifacts) {
        lines.push("## Governed Artifacts", "");
        if (report.artifacts.length === 0) {
            lines.push("No governed artifacts were discovered.", "");
        }
        else {
            for (const artifact of report.artifacts) {
                const status = artifact.status ? `, status: ${artifact.status}` : "";
                const owner = artifact.owner ? `, owner: ${artifact.owner}` : "";
                lines.push(`- \`${artifact.path}\` (${artifact.kind}${status}${owner})`);
            }
            lines.push("");
        }
    }
    lines.push("## Findings", "");
    if (report.findings.length === 0) {
        lines.push("No findings.", "");
    }
    else {
        for (const finding of report.findings) {
            lines.push(`- **${finding.severity.toUpperCase()} ${finding.code}**: ${finding.message}`);
            if (finding.file) {
                lines.push(`  - File: \`${finding.file}\``);
            }
            if (finding.relatedFiles?.length) {
                lines.push(`  - Related: ${finding.relatedFiles.map((file) => `\`${file}\``).join(", ")}`);
            }
            if (finding.suggestion) {
                lines.push(`  - Suggestion: ${finding.suggestion}`);
            }
        }
        lines.push("");
    }
    if (report.trace) {
        lines.push("## Trace Summary", "");
        lines.push(`Artifacts: ${report.trace.artifacts.length}`);
        lines.push(`Mappings: ${report.trace.mappings.length}`, "");
    }
    return `${lines.join("\n")}\n`;
}
