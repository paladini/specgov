export interface ChangedFileOptions {
    cwd: string;
    baseRef?: string;
    headRef?: string;
    explicitFiles?: string[];
}
export declare function getChangedFiles(options: ChangedFileOptions): Promise<string[]>;
