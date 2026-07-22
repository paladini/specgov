import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { Command, InvalidArgumentError } from "commander";
import { analyzeRepository } from "./analyze.js";
import { BUILTIN_ADAPTERS } from "./adapters.js";
import { configTemplate, DEFAULT_CONFIG_PATH, writeConfig } from "./config.js";
import { discoverArtifactGraph } from "./graph.js";
import { exitCodeForReport, renderGraph, renderReport } from "./report.js";
import { SpecGovError } from "./errors.js";
import type { EnforcementMode, OutputFormat } from "./types.js";

export interface CliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}
export async function runCli(
  argv: string[],
  cwd: string,
  io: CliIo,
): Promise<number> {
  const program = new Command();
  let code = 0;
  program
    .name("specgov")
    .description("Git-native governance for AI-assisted development artifacts.")
    .version("1.0.0-rc.1")
    .showHelpAfterError()
    .exitOverride()
    .configureOutput({ writeOut: io.stdout, writeErr: io.stderr });
  program
    .command("init")
    .description("Detect frameworks and preview a SpecGov v1 manifest.")
    .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
    .option("--dry-run", "Preview only.", false)
    .option("--yes", "Write without confirmation.", false)
    .action(async (o: { config: string; dryRun: boolean; yes: boolean }) => {
      const detected = [];
      for (const adapter of BUILTIN_ADAPTERS) {
        const result = await adapter.detect({
          cwd,
          ignore: ["node_modules/**", "dist/**", ".git/**"],
          allowSymlinks: false,
        });
        if (result.detected) detected.push(adapter.id);
      }
      const content = configTemplate(detected);
      io.stdout(
        `Detected frameworks: ${detected.join(", ") || "none"}\n\n${content}`,
      );
      if (o.dryRun) return;
      if (!o.yes) {
        if (!process.stdin.isTTY)
          throw new SpecGovError(
            "Confirmation required. Re-run with --yes or --dry-run.",
          );
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const answer = await rl.question(`Write ${o.config}? [y/N] `);
        rl.close();
        if (!/^y(es)?$/i.test(answer.trim())) return;
      }
      await writeConfig(cwd, o.config, content);
      io.stdout(`Created ${o.config}\n`);
    });
  program
    .command("check")
    .description("Discover, graph, and govern AI-development artifacts.")
    .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
    .option("--base-ref <ref>")
    .option("--head-ref <ref>")
    .option("--changed-file <path>", "Repeatable changed file.", collect, [])
    .option("--mode <mode>", "advisory or strict", mode)
    .option(
      "-f, --format <format>",
      "terminal, markdown, or json",
      format,
      "terminal",
    )
    .option("--semantic", "Run configured semantic auditor.", false)
    .action(
      async (o: {
        config: string;
        baseRef?: string;
        headRef?: string;
        changedFile: string[];
        mode?: EnforcementMode;
        format: OutputFormat;
        semantic: boolean;
      }) => {
        const report = await analyzeRepository({
          cwd,
          configPath: o.config,
          baseRef: o.baseRef,
          headRef: o.headRef,
          changedFiles: o.changedFile,
          mode: o.mode,
          semantic: o.semantic,
        });
        io.stdout(renderReport(report, o.format));
        code = exitCodeForReport(report);
      },
    );
  program
    .command("graph")
    .description("Emit the normalized artifact graph.")
    .option("-c, --config <path>", "Manifest path.", DEFAULT_CONFIG_PATH)
    .option("-f, --format <format>", "json or markdown", graphFormat, "json")
    .option("--out <path>")
    .action(
      async (o: {
        config: string;
        format: "json" | "markdown";
        out?: string;
      }) => {
        const graph = await discoverArtifactGraph({
          cwd,
          configPath: o.config,
        });
        const text = renderGraph(graph, o.format);
        if (o.out) {
          await fs.writeFile(path.resolve(cwd, o.out), text, "utf8");
          io.stdout(`Wrote ${o.out}\n`);
        } else io.stdout(text);
      },
    );
  try {
    await program.parseAsync(argv, { from: "user" });
    return code;
  } catch (error) {
    if (error instanceof SpecGovError) {
      io.stderr(`${error.message}\n`);
      return error.exitCode;
    }
    if (error && typeof error === "object" && "exitCode" in error)
      return Number((error as { exitCode: number }).exitCode);
    io.stderr(`${(error as Error).message}\n`);
    return 2;
  }
}
function collect(v: string, p: string[]): string[] {
  return [...p, v];
}
function mode(v: string): EnforcementMode {
  if (v === "advisory" || v === "strict") return v;
  throw new InvalidArgumentError("mode must be advisory or strict");
}
function format(v: string): OutputFormat {
  if (v === "terminal" || v === "markdown" || v === "json") return v;
  throw new InvalidArgumentError("format must be terminal, markdown, or json");
}
function graphFormat(v: string): "json" | "markdown" {
  if (v === "json" || v === "markdown") return v;
  throw new InvalidArgumentError("format must be json or markdown");
}
