import fs from "node:fs/promises";
import { parse, stringify } from "yaml";
import { z } from "zod";
import { SpecGovError } from "./errors.js";
import { resolveRepositoryPath } from "./paths.js";
import type { SpecGovConfig } from "./types.js";

export const DEFAULT_CONFIG_PATH = ".specgov.yml";
const roles = [
  "intent",
  "spec",
  "plan",
  "design",
  "task",
  "decision",
  "instruction",
  "evidence",
  "implementation",
] as const;
const configSchema = z
  .object({
    schema: z.literal("specgov/v1"),
    mode: z.enum(["advisory", "strict"]).default("advisory"),
    frameworks: z
      .union([z.literal("auto"), z.array(z.string().min(1))])
      .default("auto"),
    domains: z
      .array(
        z.object({
          id: z.string().min(1),
          code: z.array(z.string().min(1)).min(1),
          artifacts: z.array(z.string().min(1)).min(1),
        }),
      )
      .default([]),
    policies: z
      .object({
        require_complete_chain: z.boolean().default(true),
        require_change_artifact_for_code: z.boolean().default(true),
        require_verification_evidence: z.boolean().default(false),
        stale_after_days: z.number().int().nonnegative().default(90),
      })
      .default({
        require_complete_chain: true,
        require_change_artifact_for_code: true,
        require_verification_evidence: false,
        stale_after_days: 90,
      }),
    ignore: z
      .array(z.string().min(1))
      .default(["node_modules/**", "dist/**", ".git/**"]),
    allow_symlinks: z.boolean().default(false),
    generic: z
      .object({
        roots: z.array(z.string().min(1)).default([".specs/features"]),
        roles: z
          .array(
            z.object({
              role: z.enum(roles),
              patterns: z.array(z.string().min(1)).min(1),
            }),
          )
          .default([]),
      })
      .optional(),
    semantic: z
      .object({
        enabled: z.boolean().default(false),
        command: z.array(z.string().min(1)).min(1).optional(),
        timeout_ms: z.number().int().positive().max(300_000).default(30_000),
        max_output_bytes: z
          .number()
          .int()
          .positive()
          .max(50_000_000)
          .default(1_000_000),
        failure_policy: z.enum(["warn", "fail"]).default("warn"),
      })
      .default({
        enabled: false,
        timeout_ms: 30_000,
        max_output_bytes: 1_000_000,
        failure_policy: "warn",
      }),
  })
  .strict();

export const DEFAULT_CONFIG: SpecGovConfig = configSchema.parse({
  schema: "specgov/v1",
});

export async function loadSpecGovConfig(
  options: { cwd?: string; configPath?: string; optional?: boolean } = {},
): Promise<SpecGovConfig> {
  const cwd = options.cwd ?? process.cwd();
  const relative = options.configPath ?? DEFAULT_CONFIG_PATH;
  const target = await resolveRepositoryPath(cwd, relative);
  let text: string;
  try {
    text = await fs.readFile(target, "utf8");
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" &&
      options.optional !== false
    )
      return DEFAULT_CONFIG;
    throw new SpecGovError(`SpecGov manifest not found at ${relative}.`);
  }
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (error) {
    throw new SpecGovError(
      `Invalid YAML in ${relative}: ${(error as Error).message}`,
    );
  }
  if (
    raw &&
    typeof raw === "object" &&
    ("artifacts" in raw ||
      "mappings" in raw ||
      "rules" in raw ||
      "version" in raw)
  )
    throw new SpecGovError(
      "LEGACY_MANIFEST_UNSUPPORTED: v0.1 manifests are not supported by SpecGov v1. See docs/upgrade-v1.md.",
    );
  const result = configSchema.safeParse(raw);
  if (!result.success)
    throw new SpecGovError(
      `Invalid ${relative}: ${z.prettifyError(result.error)}`,
    );
  return result.data;
}

export function configTemplate(frameworks: string[]): string {
  return stringify(
    {
      schema: "specgov/v1",
      mode: "advisory",
      frameworks: frameworks.length ? frameworks : "auto",
      domains: [],
      policies: DEFAULT_CONFIG.policies,
      ignore: DEFAULT_CONFIG.ignore,
      semantic: { enabled: false },
    },
    { lineWidth: 0 },
  );
}

export async function writeConfig(
  cwd: string,
  configPath: string,
  content: string,
): Promise<void> {
  const target = await resolveRepositoryPath(cwd, configPath);
  try {
    await fs.access(target);
    throw new SpecGovError(`${configPath} already exists.`);
  } catch (error) {
    if (error instanceof SpecGovError) throw error;
  }
  await fs.writeFile(target, content, "utf8");
}
