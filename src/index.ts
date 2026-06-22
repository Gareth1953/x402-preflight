// Library entry point. Use programmatically, or via the CLI (src/cli.ts).

import type { X402Config, Finding, CheckOptions } from "./types.js";
import {
  checkNetworkVersion,
  checkAssetDomainName,
  checkAssetNetwork,
  checkFacilitatorCapability,
  checkPrice,
  checkPayTo,
  checkFacilitatorSupported,
} from "./checks.js";

export * from "./types.js";
export * from "./checks.js";
export * from "./knowledge.js";

/** Run all checks against a config. With `live`, also calls the facilitator's /supported. */
export async function runChecks(config: X402Config, opts: CheckOptions = {}): Promise<Finding[]> {
  const findings: Finding[] = [
    checkNetworkVersion(config),
    checkAssetDomainName(config),
    checkAssetNetwork(config),
    checkFacilitatorCapability(config),
    checkPrice(config),
    checkPayTo(config),
  ];
  if (opts.live) findings.push(await checkFacilitatorSupported(config));
  return findings;
}

export function hasFailures(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "fail");
}
