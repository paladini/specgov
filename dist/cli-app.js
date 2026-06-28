import fs from "node:fs/promises";
import path from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { runCheckPr, runDrift, runScan, runTrace } from "./checks.js";
import { SpecGovError } from "./errors.js";
import { DEFAULT_CONFIG_PATH, loadConfig, writeDefaultConfig, } from "./manifest.js";
import { exitCodeForReport, renderReport } from "./report.js";
export async function runCli(argv, cwd, io) {
    const program = new Command();
    let exitCode = 0;
    program
        .name("specgov")
        .description("Spec governance layer for Git repositories.")
        .version("0.1.0")
        .showHelpAfterError()
        .exitOverride();
    program.configureOutput({
        writeOut: (text) => io.stdout(text),
        writeErr: (text) => io.stderr(text),
    });
    program
        .command("init")
        .description("Create a .specgov.yml template.")
        .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
        .option("--force", "Overwrite an existing manifest.", false)
        .action(async (options) => {
        await writeDefaultConfig(cwd, options.config, options.force);
        io.stdout(`Created ${options.config}\n`);
    });
    program
        .command("scan")
        .description("Discover governed artifacts and validate lifecycle metadata.")
        .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
        .option("-f, --format <format>", "Output format: markdown or json.", parseFormat, "markdown")
        .action(async (options) => {
        const config = await loadConfig(cwd, options.config);
        const report = await runScan({ cwd, config });
        io.stdout(renderReport(report, options.format));
        exitCode = exitCodeForReport(report);
    });
    program
        .command("check-pr")
        .description("Check changed files for missing spec impact.")
        .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
        .option("--base-ref <ref>", "Base git ref for comparison.")
        .option("--head-ref <ref>", "Head git ref for comparison.")
        .option("--changed-file <path>", "Explicit changed file. Repeatable.", collect, [])
        .option("--mode <mode>", "Override enforcement mode: advisory or strict.", parseMode)
        .option("-f, --format <format>", "Output format: markdown or json.", parseFormat, "markdown")
        .action(async (options) => {
        const config = await loadConfig(cwd, options.config);
        const report = await runCheckPr({
            cwd,
            config,
            baseRef: options.baseRef,
            headRef: options.headRef,
            changedFiles: options.changedFile,
            mode: options.mode,
        });
        io.stdout(renderReport(report, options.format));
        exitCode = exitCodeForReport(report);
    });
    program
        .command("trace")
        .description("Generate a machine-readable trace index.")
        .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
        .option("--out <path>", "Write trace JSON to a file.")
        .action(async (options) => {
        const config = await loadConfig(cwd, options.config);
        const trace = await runTrace({ cwd, config });
        const text = `${JSON.stringify(trace, null, 2)}\n`;
        if (options.out) {
            await fs.writeFile(path.resolve(cwd, options.out), text, "utf8");
            io.stdout(`Wrote ${options.out}\n`);
        }
        else {
            io.stdout(text);
        }
    });
    program
        .command("drift")
        .description("Report stale, empty, superseded, and orphaned spec artifacts.")
        .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
        .option("-f, --format <format>", "Output format: markdown or json.", parseFormat, "markdown")
        .action(async (options) => {
        const config = await loadConfig(cwd, options.config);
        const report = await runDrift({ cwd, config });
        io.stdout(renderReport(report, options.format));
        exitCode = exitCodeForReport(report);
    });
    try {
        await program.parseAsync(argv, { from: "user" });
        return exitCode;
    }
    catch (error) {
        if (error instanceof SpecGovError) {
            io.stderr(`${error.message}\n`);
            return error.exitCode;
        }
        if (isCommanderExit(error)) {
            return error.exitCode;
        }
        io.stderr(`${error.message}\n`);
        return 2;
    }
}
function parseFormat(value) {
    if (value === "json" || value === "markdown") {
        return value;
    }
    throw new InvalidArgumentError('format must be "json" or "markdown".');
}
function parseMode(value) {
    if (value === "advisory" || value === "strict") {
        return value;
    }
    throw new InvalidArgumentError('mode must be "advisory" or "strict".');
}
function collect(value, previous) {
    previous.push(value);
    return previous;
}
function isCommanderExit(error) {
    return Boolean(error && typeof error === "object" && "exitCode" in error);
}
