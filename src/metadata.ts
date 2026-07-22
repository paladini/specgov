import fs from "node:fs/promises";
import { parse } from "yaml";
import type {
  ArtifactRelationType,
  ArtifactRole,
  ArtifactState,
  DeclaredProducer,
} from "./types.js";

export interface DeclaredMetadata {
  role?: ArtifactRole;
  state?: ArtifactState;
  scope?: string[];
  owner?: string;
  lastVerified?: string;
  producer?: DeclaredProducer;
  relations?: Array<{ targetPath: string; type: ArtifactRelationType }>;
}
const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/;
const roles = new Set([
  "intent",
  "spec",
  "plan",
  "design",
  "task",
  "decision",
  "instruction",
  "evidence",
  "implementation",
]);
const states = new Set([
  "draft",
  "active",
  "implemented",
  "verified",
  "superseded",
  "archived",
]);
const relations = new Set([
  "derives_from",
  "governs",
  "implements",
  "verifies",
  "supersedes",
]);

export async function readDeclaredMetadata(
  filePath: string,
): Promise<DeclaredMetadata> {
  if (!/\.(md|mdx)$/i.test(filePath)) return {};
  const text = await fs.readFile(filePath, "utf8");
  const match = text.match(frontmatter);
  if (!match?.[1]) return {};
  let doc: unknown;
  try {
    doc = parse(match[1]);
  } catch {
    return {};
  }
  if (!doc || typeof doc !== "object" || !("specgov" in doc)) return {};
  const raw = (doc as { specgov?: unknown }).specgov;
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const result: DeclaredMetadata = {};
  if (typeof value.role === "string" && roles.has(value.role))
    result.role = value.role as ArtifactRole;
  if (typeof value.state === "string" && states.has(value.state))
    result.state = value.state as ArtifactState;
  if (typeof value.owner === "string") result.owner = value.owner;
  if (typeof value.last_verified === "string")
    result.lastVerified = value.last_verified;
  if (
    Array.isArray(value.scope) &&
    value.scope.every((x) => typeof x === "string")
  )
    result.scope = value.scope;
  if (value.producer && typeof value.producer === "object") {
    const p = value.producer as Record<string, unknown>;
    result.producer = {
      tool: string(p.tool),
      model: string(p.model),
      session: string(p.session),
      generatedAt: string(p.generated_at),
      inputs: strings(p.inputs),
    };
  }
  if (Array.isArray(value.relations))
    result.relations = value.relations.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const r = entry as Record<string, unknown>;
      return typeof r.target === "string" &&
        typeof r.type === "string" &&
        relations.has(r.type)
        ? [{ targetPath: r.target, type: r.type as ArtifactRelationType }]
        : [];
    });
  return result;
}
function string(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function strings(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((x) => typeof x === "string")
    ? value
    : undefined;
}
