export declare function normalizePath(input: string): string;
export declare function relativeToCwd(cwd: string, filePath: string): string;
export declare function repositoryRelativePath(cwd: string, input: string): string;
export declare function resolveRepositoryPath(cwd: string, input: string): Promise<string>;
export declare function toArray(value: string | string[] | undefined): string[];
