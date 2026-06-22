#!/usr/bin/env node
// x402-preflight CLI.

import { readFileSync } from "node:fs";
import { runChecks, hasFailures } from "./index.js";
import { parseWranglerVars } from "./wrangler.js";
import type { X402Config, Severity } from "./types.js";

function usage(): never {
  console.log(`x402-preflight — catch silent-fail landmines in your x402 config before deploy.

Usage:
  x402-preflight check <file> [--wrangler] [--live]

  <file>       a JSON config, or a wrangler.toml (use --wrangler, or a .toml extension)
  --wrangler   parse <file> as a wrangler.toml [vars] block
  --live       also call the facilitator's /supported endpoint (a network request)

Exit code is non-zero if any check FAILS (CI-friendly).

Example:
  x402-preflight check ./examples/bad.json`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args[0] !== "check") usage();
const file = args[1];
if (!file || file.startsWith("--")) usage();
const wrangler = args.includes("--wrangler") || file.toLowerCase().endsWith(".toml");
const live = args.includes("--live");

let config: X402Config;
try {
  const raw = readFileSync(file, "utf8");
  config = wrangler ? parseWranglerVars(raw) : (JSON.parse(raw) as X402Config);
} catch (e) {
  console.error(`Could not read/parse ${file}: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
}

const ICON: Record<Severity, string> = { fail: "x", warn: "!", pass: "+", info: "." };

const findings = await runChecks(config, { live });
console.log(`\nx402-preflight — ${findings.length} checks on ${file}\n`);
for (const f of findings) {
  console.log(`  ${ICON[f.severity]} [${f.severity.toUpperCase()}] ${f.check}: ${f.message}`);
  if (f.why && (f.severity === "fail" || f.severity === "warn")) {
    console.log(`      why: ${f.why}`);
  }
}
const fails = findings.filter((f) => f.severity === "fail").length;
const warns = findings.filter((f) => f.severity === "warn").length;
console.log(`\n  ${fails} fail · ${warns} warn\n`);
process.exit(hasFailures(findings) ? 1 : 0);
