// Shared types for x402-preflight.

/** A minimal x402 payment configuration to check. */
export interface X402Config {
  /** 1 (chain-name networks like "base") or 2 (CAIP-2 like "eip155:8453"). */
  x402Version?: number;
  scheme?: string;
  /** e.g. "base", "base-sepolia", "eip155:8453", "eip155:84532". */
  network?: string;
  /** Token contract address (the asset paid in, e.g. USDC). */
  asset?: string;
  /** EIP-712 domain name advertised to payers (the `extra.name`). */
  assetName?: string;
  /** EIP-712 domain version (the `extra.version`). */
  assetVersion?: string;
  facilitatorUrl?: string;
  /** "$0.01", "0.01", or an atomic integer like "10000" (6-dp USDC). */
  price?: string;
  /** Recipient address. */
  payTo?: string;
}

export type Severity = "fail" | "warn" | "pass" | "info";

export interface Finding {
  check: string;
  severity: Severity;
  message: string;
  /** Why it matters — shown for fail/warn. */
  why?: string;
}

export interface CheckOptions {
  /** Also call the facilitator's /supported endpoint (a network request). */
  live?: boolean;
}
