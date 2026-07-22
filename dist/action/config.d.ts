import type { SpecGovConfig } from "./types.js";
export declare const DEFAULT_CONFIG_PATH = ".specgov.yml";
export declare const DEFAULT_CONFIG: SpecGovConfig;
export declare function loadSpecGovConfig(options?: {
    cwd?: string;
    configPath?: string;
    optional?: boolean;
}): Promise<SpecGovConfig>;
export declare function configTemplate(frameworks: string[]): string;
export declare function writeConfig(cwd: string, configPath: string, content: string): Promise<void>;
