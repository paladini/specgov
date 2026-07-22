import process from "node:process";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
if (request.schemaVersion !== "1") throw new Error("Unsupported input schema");
process.stdout.write(JSON.stringify({ schemaVersion: "1", findings: [] }));
