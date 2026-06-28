import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { SpecGovError } from "./errors.js";
import type {
  ArtifactRule,
  EnforcementMode,
  GovernanceRules,
  MappingRule,
  SpecGovConfig,
} from "./types.js";

export const DEFAULT_CONFIG_PATH = ".specgov.yml";

const DEFAULT_RULES: GovernanceRules = {
  require_spec_impact_for_code_changes: true,
  require_lifecycle_status: false,
  require_owner_for_active_specs: false,
  stale_after_days: 180,
};

export const DEFAULT_CONFIG_TEMPLATE = `version: 1
mode: advisory

artifacts:
  - path: "docs/**/*.md"
    kind: documentation
    owner: docs
  - path: "adr/**/*.md"
    kind: decision
    owner: architecture
  - path: ".specs/**/*.md"
    kind: specification
    owner: engineering

mappings:
  - code: "src/**"
    specs:
      - "docs/**"
      - "adr/**"
      - ".specs/**"

rules:
  require_spec_impact_for_code_changes: true
  require_lifecycle_status: false
  require_owner_for_active_specs: false
  stale_after_days: 180

ignore:
  - "node_modules/**"
  - "dist/**"
  - ".git/**"
`;

interface RawConfig {
  version?: unknown;
  mode?: unknown;
  artifacts?: unknown;
  mappings?: unknown;
  rules?: unknown;
  ignore?: unknown;
}

export async function loadConfig(
  cwd: string,
  configPath = DEFAULT_CONFIG_PATH,
): Promise<SpecGovConfig> {
  const absolutePath = path.resolve(cwd, configPath);
  let text: string;
  try {
    text = await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      throw new SpecGovError(
        `SpecGov manifest not found at ${configPath}. Run "specgov init" first.`,
      );
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (error) {
    throw new SpecGovError(
      `Invalid YAML in ${configPath}: ${(error as Error).message}`,
    );
  }

  return normalizeConfig(parsed, configPath);
}

export async function writeDefaultConfig(
  cwd: string,
  configPath = DEFAULT_CONFIG_PATH,
  force = false,
): Promise<void> {
  const absolutePath = path.resolve(cwd, configPath);
  if (!force) {
    try {
      await fs.access(absolutePath);
      throw new SpecGovError(
        `SpecGov manifest already exists at ${configPath}. Use --force to overwrite.`,
      );
    } catch (error) {
      if (error instanceof SpecGovError) {
        throw error;
      }
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }
  }
  await fs.writeFile(absolutePath, DEFAULT_CONFIG_TEMPLATE, "utf8");
}

export function normalizeConfig(
  input: unknown,
  source = DEFAULT_CONFIG_PATH,
): SpecGovConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SpecGovError(`Invalid ${source}: expected a YAML object.`);
  }

  const raw = input as RawConfig;
  return {
    version: normalizeVersion(raw.version),
    mode: normalizeMode(raw.mode),
    artifacts: normalizeArtifacts(raw.artifacts),
    mappings: normalizeMappings(raw.mappings),
    rules: normalizeRules(raw.rules),
    ignore: normalizeStringArray(raw.ignore, "ignore", true),
  };
}

function normalizeVersion(value: unknown): number {
  if (value === undefined) {
    return 1;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new SpecGovError(
      "Invalid manifest: version must be a positive integer.",
    );
  }
  return value;
}

function normalizeMode(value: unknown): EnforcementMode {
  if (value === undefined) {
    return "advisory";
  }
  if (value === "advisory" || value === "strict") {
    return value;
  }
  throw new SpecGovError(
    'Invalid manifest: mode must be "advisory" or "strict".',
  );
}

function normalizeRules(value: unknown): GovernanceRules {
  if (value === undefined) {
    return { ...DEFAULT_RULES };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SpecGovError("Invalid manifest: rules must be an object.");
  }
  const raw = value as Partial<Record<keyof GovernanceRules, unknown>>;
  return {
    require_spec_impact_for_code_changes: boolOrDefault(
      raw.require_spec_impact_for_code_changes,
      DEFAULT_RULES.require_spec_impact_for_code_changes,
      "rules.require_spec_impact_for_code_changes",
    ),
    require_lifecycle_status: boolOrDefault(
      raw.require_lifecycle_status,
      DEFAULT_RULES.require_lifecycle_status,
      "rules.require_lifecycle_status",
    ),
    require_owner_for_active_specs: boolOrDefault(
      raw.require_owner_for_active_specs,
      DEFAULT_RULES.require_owner_for_active_specs,
      "rules.require_owner_for_active_specs",
    ),
    stale_after_days: numberOrDefault(
      raw.stale_after_days,
      DEFAULT_RULES.stale_after_days,
      "rules.stale_after_days",
    ),
  };
}

function normalizeArtifacts(value: unknown): ArtifactRule[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new SpecGovError("Invalid manifest: artifacts must be a list.");
  }
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new SpecGovError(
        `Invalid manifest: artifacts[${index}] must be an object.`,
      );
    }
    const raw = item as Partial<ArtifactRule>;
    const artifact: ArtifactRule = {
      path: normalizeStringOrArray(raw.path, `artifacts[${index}].path`),
      kind: stringOrThrow(raw.kind, `artifacts[${index}].kind`),
    };
    if (raw.owner !== undefined) {
      artifact.owner = stringOrThrow(raw.owner, `artifacts[${index}].owner`);
    }
    if (raw.status !== undefined) {
      artifact.status = normalizeStatus(
        raw.status,
        `artifacts[${index}].status`,
      );
    }
    return artifact;
  });
}

function normalizeMappings(value: unknown): MappingRule[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new SpecGovError("Invalid manifest: mappings must be a list.");
  }
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new SpecGovError(
        `Invalid manifest: mappings[${index}] must be an object.`,
      );
    }
    const raw = item as Partial<MappingRule>;
    const mapping: MappingRule = {
      code: normalizeStringOrArray(raw.code, `mappings[${index}].code`),
      specs: normalizeStringOrArray(raw.specs, `mappings[${index}].specs`),
    };
    if (raw.description !== undefined) {
      mapping.description = stringOrThrow(
        raw.description,
        `mappings[${index}].description`,
      );
    }
    return mapping;
  });
}

function normalizeStatus(value: unknown, field: string) {
  if (
    value === "draft" ||
    value === "active" ||
    value === "superseded" ||
    value === "deprecated" ||
    value === "archived"
  ) {
    return value;
  }
  throw new SpecGovError(
    `Invalid manifest: ${field} has unsupported lifecycle status.`,
  );
}

function normalizeStringOrArray(
  value: unknown,
  field: string,
): string | string[] {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim())
  ) {
    return value;
  }
  throw new SpecGovError(
    `Invalid manifest: ${field} must be a string or list of strings.`,
  );
}

function normalizeStringArray(
  value: unknown,
  field: string,
  withDefaults = false,
): string[] {
  if (value === undefined) {
    return withDefaults ? ["node_modules/**", "dist/**", ".git/**"] : [];
  }
  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim())
  ) {
    return value;
  }
  throw new SpecGovError(
    `Invalid manifest: ${field} must be a list of strings.`,
  );
}

function stringOrThrow(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  throw new SpecGovError(
    `Invalid manifest: ${field} must be a non-empty string.`,
  );
}

function boolOrDefault(
  value: unknown,
  defaultValue: boolean,
  field: string,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  throw new SpecGovError(`Invalid manifest: ${field} must be a boolean.`);
}

function numberOrDefault(
  value: unknown,
  defaultValue: number,
  field: string,
): number {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  throw new SpecGovError(
    `Invalid manifest: ${field} must be a non-negative number.`,
  );
}
