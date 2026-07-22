import fs from "node:fs/promises";
import process from "node:process";

const files = {
  agents: await fs.readFile("AGENTS.md", "utf8"),
  claude: await fs.readFile("CLAUDE.md", "utf8"),
  copilot: await fs.readFile(".github/copilot-instructions.md", "utf8"),
};

const requiredContract = [
  "framework-agnostic governance layer",
  "Deterministic analysis is the product core",
  "explicitly configured domain",
  "without a shell",
  "declaration, not verified provenance",
  "`init`, `check`, and `graph`",
];

const errors = [];
for (const marker of requiredContract) {
  if (!files.agents.includes(marker)) {
    errors.push(`AGENTS.md is missing required contract marker: ${marker}`);
  }
}

for (const [name, content] of Object.entries(files)) {
  if (/C:\\Users\\|\/Users\/|\/home\//i.test(content)) {
    errors.push(`${name} contains a machine-specific home path`);
  }
}

if (!files.claude.includes("[`AGENTS.md`](AGENTS.md)")) {
  errors.push("CLAUDE.md must point to the canonical AGENTS.md");
}
if (!files.copilot.includes("[`../AGENTS.md`](../AGENTS.md)")) {
  errors.push("Copilot instructions must point to the canonical AGENTS.md");
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("Repository harness is aligned.\n");
