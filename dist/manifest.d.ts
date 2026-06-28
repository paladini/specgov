import type { SpecGovConfig } from "./types.js";
export declare const DEFAULT_CONFIG_PATH = ".specgov.yml";
export declare const DEFAULT_CONFIG_TEMPLATE = "version: 1\nmode: advisory\n\nartifacts:\n  - path: \"docs/**/*.md\"\n    kind: documentation\n    owner: docs\n  - path: \"adr/**/*.md\"\n    kind: decision\n    owner: architecture\n  - path: \".specs/**/*.md\"\n    kind: specification\n    owner: engineering\n\nmappings:\n  - code: \"src/**\"\n    specs:\n      - \"docs/**\"\n      - \"adr/**\"\n      - \".specs/**\"\n\nrules:\n  require_spec_impact_for_code_changes: true\n  require_lifecycle_status: false\n  require_owner_for_active_specs: false\n  stale_after_days: 180\n\nignore:\n  - \"node_modules/**\"\n  - \"dist/**\"\n  - \".git/**\"\n";
export declare function loadConfig(cwd: string, configPath?: string): Promise<SpecGovConfig>;
export declare function writeDefaultConfig(cwd: string, configPath?: string, force?: boolean): Promise<void>;
export declare function normalizeConfig(input: unknown, source?: string): SpecGovConfig;
