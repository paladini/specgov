export interface CliIo {
    stdout: (text: string) => void;
    stderr: (text: string) => void;
}
export declare function runCli(argv: string[], cwd: string, io: CliIo): Promise<number>;
