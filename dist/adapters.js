import fg from "fast-glob";
import path from "node:path";
async function files(context, patterns) {
    return fg(patterns, {
        cwd: context.cwd,
        onlyFiles: true,
        dot: true,
        followSymbolicLinks: context.allowSymlinks,
        ignore: context.ignore,
    }).then((x) => x.map(posix).sort());
}
function posix(value) {
    return value.replaceAll(path.sep, "/").replaceAll("\\", "/");
}
function stateFor(root) {
    return /(^|\/)archive(d)?(\/|$)/i.test(root) ? "archived" : "active";
}
function changeRoot(file, marker) {
    const parts = file.split("/");
    const i = parts.indexOf(marker);
    const offset = marker === "changes" && parts[i + 1] === "archive" ? 3 : 2;
    return i >= 0 && parts[i + offset - 1]
        ? parts.slice(0, i + offset).join("/")
        : file.split("/").slice(0, -1).join("/");
}
class PatternAdapter {
    id;
    markers;
    rules;
    rootMarker;
    constructor(id, markers, rules, rootMarker) {
        this.id = id;
        this.markers = markers;
        this.rules = rules;
        this.rootMarker = rootMarker;
    }
    async detect(context) {
        const roots = await files(context, this.markers);
        return {
            detected: roots.length > 0,
            confidence: roots.length > 1 ? "high" : "medium",
            roots,
        };
    }
    async discover(context) {
        const drafts = [];
        const sets = new Map();
        for (const rule of this.rules)
            for (const file of await files(context, rule.patterns)) {
                const root = changeRoot(file, this.rootMarker);
                const changeSetId = `${this.id}:${root}`;
                sets.set(changeSetId, { id: changeSetId, root, state: stateFor(root) });
                drafts.push({
                    path: file,
                    role: rule.role,
                    changeSetId,
                    state: stateFor(root),
                });
            }
        return { artifacts: drafts, changeSets: [...sets.values()] };
    }
}
export const specKitAdapter = new PatternAdapter("spec-kit", [".specify/memory/constitution.md", "specs/*/spec.md"], [
    { role: "instruction", patterns: [".specify/memory/constitution.md"] },
    { role: "spec", patterns: ["specs/*/spec.md"] },
    { role: "plan", patterns: ["specs/*/plan.md"] },
    { role: "task", patterns: ["specs/*/tasks.md"] },
    {
        role: "evidence",
        patterns: ["specs/*/checklists/**/*.md", "specs/*/evidence/**/*.md"],
    },
], "specs");
export const openSpecAdapter = new PatternAdapter("openspec", [
    "openspec/config.yaml",
    "openspec/specs/**/*.md",
    "openspec/changes/*/proposal.md",
], [
    {
        role: "intent",
        patterns: [
            "openspec/changes/*/proposal.md",
            "openspec/changes/archive/*/proposal.md",
        ],
    },
    {
        role: "spec",
        patterns: [
            "openspec/specs/**/*.md",
            "openspec/changes/*/specs/**/*.md",
            "openspec/changes/archive/*/specs/**/*.md",
        ],
    },
    {
        role: "design",
        patterns: [
            "openspec/changes/*/design.md",
            "openspec/changes/archive/*/design.md",
        ],
    },
    {
        role: "task",
        patterns: [
            "openspec/changes/*/tasks.md",
            "openspec/changes/archive/*/tasks.md",
        ],
    },
], "changes");
export const kiroAdapter = new PatternAdapter("kiro", [
    ".kiro/specs/*/requirements.md",
    ".kiro/specs/*/bugfix.md",
    ".kiro/steering/**/*.md",
], [
    { role: "instruction", patterns: [".kiro/steering/**/*.md"] },
    {
        role: "spec",
        patterns: [".kiro/specs/*/requirements.md", ".kiro/specs/*/bugfix.md"],
    },
    { role: "design", patterns: [".kiro/specs/*/design.md"] },
    { role: "task", patterns: [".kiro/specs/*/tasks.md"] },
    {
        role: "evidence",
        patterns: [
            ".kiro/specs/*/evidence/**/*.md",
            ".kiro/specs/*/validation.md",
        ],
    },
], "specs");
export const genericAdapter = {
    id: "generic",
    async detect(context) {
        const roots = context.generic?.roots ?? [".specs/features"];
        const matched = await files(context, roots.flatMap((r) => [
            `${r}/*/spec.md`,
            `${r}/*/design.md`,
            `${r}/*/tasks.md`,
        ]));
        return {
            detected: matched.length > 0,
            confidence: matched.length >= 2 ? "high" : "medium",
            roots: [
                ...new Set(matched.map((f) => f.split("/").slice(0, -1).join("/"))),
            ],
        };
    },
    async discover(context) {
        const roots = context.generic?.roots ?? [".specs/features"];
        const rules = context.generic?.roles.length
            ? context.generic.roles
            : [
                { role: "spec", patterns: ["spec.md"] },
                { role: "design", patterns: ["design.md", "plan.md"] },
                { role: "task", patterns: ["tasks.md"] },
                {
                    role: "evidence",
                    patterns: ["validation.md", "evidence.md", "SUMMARY.md"],
                },
            ];
        const artifacts = [];
        const changeSets = [];
        for (const root of roots) {
            const dirs = new Set();
            for (const rule of rules)
                for (const file of await files(context, rule.patterns.flatMap((p) => [`${root}/*/${p}`, `${root}/${p}`]))) {
                    const dir = file.split("/").slice(0, -1).join("/");
                    dirs.add(dir);
                    artifacts.push({
                        path: file,
                        role: rule.role,
                        changeSetId: `generic:${dir}`,
                        state: "active",
                    });
                }
            for (const dir of dirs)
                changeSets.push({
                    id: `generic:${dir}`,
                    root: dir,
                    state: "active",
                });
        }
        return { artifacts, changeSets };
    },
};
export const BUILTIN_ADAPTERS = [
    specKitAdapter,
    openSpecAdapter,
    kiroAdapter,
    genericAdapter,
];
