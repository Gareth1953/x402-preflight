// The checks. Each is a pure function (config -> Finding) except the live facilitator
// check (async). Every "why" comes from a real, silent-fail landmine.

import type { X402Config, Finding } from "./types.js";
import { assetInfo, networkInfo, facilitatorFor } from "./knowledge.js";

/** Parse a price into US dollars. Accepts "$0.01", "0.01", or an atomic integer
 *  string (6-dp USDC, e.g. "10000" = $0.01). Returns null if unparseable. */
export function priceToDollars(price: string | undefined): number | null {
  if (price == null) return null;
  const t = String(price).trim();
  // A "$" prefix or a decimal point means a dollar amount; a bare integer is an
  // atomic USDC value (6 decimals), e.g. "10000" = $0.01.
  if (t.startsWith("$") || t.includes(".")) {
    const n = Number(t.replace(/^\$/, ""));
    return Number.isFinite(n) ? n : null;
  }
  if (/^\d+$/.test(t)) return Number(t) / 1_000_000;
  return null;
}

export function checkNetworkVersion(c: X402Config): Finding {
  const check = "network-version";
  if (!c.network) return { check, severity: "info", message: "No network set — skipped." };
  const ni = networkInfo(c.network);
  if (!ni) {
    return {
      check,
      severity: "info",
      message: `Unknown network "${c.network}" — can't verify the version form (known: base, base-sepolia, eip155:8453, eip155:84532).`,
    };
  }
  if (c.x402Version == null) {
    return {
      check,
      severity: "info",
      message: `network "${c.network}" is the ${ni.form === "name" ? "v1 (chain-name)" : "v2 (CAIP-2)"} form; set x402Version to ${ni.x402Version} to confirm.`,
    };
  }
  if (c.x402Version !== ni.x402Version) {
    const wantForDeclared = c.x402Version === 1 ? ni.canonicalName : ni.chainId;
    return {
      check,
      severity: "fail",
      message: `x402Version is ${c.x402Version} but network "${c.network}" is the v${ni.x402Version} form. For v${c.x402Version}, use "${wantForDeclared}".`,
      why: "x402 v1 uses chain names (base); v2 uses CAIP-2 (eip155:8453). A version/form mismatch makes the facilitator silently reject the payment.",
    };
  }
  return { check, severity: "pass", message: `network "${c.network}" matches x402Version ${c.x402Version}.` };
}

export function checkAssetDomainName(c: X402Config): Finding {
  const check = "asset-domain-name";
  if (!c.asset) return { check, severity: "info", message: "No asset set — skipped." };
  const a = assetInfo(c.asset);
  if (!a) {
    return { check, severity: "info", message: `Asset ${c.asset} not in the known list — can't verify its EIP-712 domain name.` };
  }
  if (c.assetName == null) {
    return {
      check,
      severity: "warn",
      message: `assetName not set for ${a.label}; it MUST be "${a.name}" (the token's on-chain name()).`,
      why: "The EIP-712 domain name is what payers sign against. If it doesn't match the token's on-chain name(), every signature silently fails to settle.",
    };
  }
  if (c.assetName !== a.name) {
    return {
      check,
      severity: "fail",
      message: `assetName is "${c.assetName}" but ${a.label}'s on-chain name() is "${a.name}".`,
      why: 'EIP-712 domain mismatch → every payer signature silently fails. Classic trap: testnet USDC is "USDC" but Base mainnet USDC is "USD Coin".',
    };
  }
  if (c.assetVersion != null && c.assetVersion !== a.version) {
    return {
      check,
      severity: "fail",
      message: `assetVersion is "${c.assetVersion}" but ${a.label}'s EIP-712 version is "${a.version}".`,
      why: "The EIP-712 domain version must match the token, or signatures fail.",
    };
  }
  return { check, severity: "pass", message: `assetName "${c.assetName}" matches ${a.label}.` };
}

export function checkAssetNetwork(c: X402Config): Finding {
  const check = "asset-network";
  if (!c.asset || !c.network) return { check, severity: "info", message: "asset or network not set — skipped." };
  const a = assetInfo(c.asset);
  const ni = networkInfo(c.network);
  if (!a || !ni) return { check, severity: "info", message: "asset or network not recognised — skipped." };
  if (a.chainId !== ni.chainId) {
    return {
      check,
      severity: "fail",
      message: `${a.label} (${a.chainId}) is on a different chain than network "${c.network}" (${ni.chainId}).`,
      why: "A testnet asset address on a mainnet network (or vice-versa) can't settle — the token doesn't exist there.",
    };
  }
  return { check, severity: "pass", message: `${a.label} matches network "${c.network}".` };
}

export function checkFacilitatorCapability(c: X402Config): Finding {
  const check = "facilitator-capability";
  if (!c.facilitatorUrl) return { check, severity: "info", message: "No facilitatorUrl set — skipped." };
  const f = facilitatorFor(c.facilitatorUrl);
  const ni = networkInfo(c.network);
  if (!f) return { check, severity: "info", message: `Facilitator ${c.facilitatorUrl} not in the known list — can't assess capability.` };
  if (ni && ni.mainnet && !f.mainnet) {
    return {
      check,
      severity: "fail",
      message: `Facilitator ${f.host} is ${f.note}, but your network "${c.network}" is mainnet.`,
      why: "A testnet-only facilitator cannot settle mainnet payments — calls will fail. Use a mainnet-capable facilitator.",
    };
  }
  if (f.requiresBusiness) {
    return {
      check,
      severity: "warn",
      message: `${f.host}: ${f.note}.`,
      why: "Without a registered business this facilitator rejects your key — a valid, enabled key still returns 401. Consider an open facilitator if you have no business entity.",
    };
  }
  return { check, severity: "pass", message: `${f.host}: ${f.note}.` };
}

export function checkPrice(c: X402Config): Finding {
  const check = "price-sanity";
  if (c.price == null) return { check, severity: "info", message: "No price set — skipped." };
  const d = priceToDollars(c.price);
  if (d == null) return { check, severity: "info", message: `Couldn't parse price "${c.price}".` };
  const ni = networkInfo(c.network);
  if (d === 0) return { check, severity: "info", message: "Price is 0 (free)." };
  if (d > 0 && d < 0.01) {
    return {
      check,
      severity: "warn",
      message: `Price ~$${d} is sub-cent${ni?.mainnet ? " on mainnet" : ""}.`,
      why: "On mainnet, settlement gas/facilitator fees run ~$0.001–0.01; a sub-cent price is often loss-making or eaten entirely by fees. Price ≥ $0.01, or use a gas-sponsoring facilitator.",
    };
  }
  return { check, severity: "pass", message: `Price ~$${d} is sane.` };
}

export function checkPayTo(c: X402Config): Finding {
  const check = "pay-to";
  if (c.payTo == null) {
    return { check, severity: "warn", message: "payTo not set — payments have no recipient.", why: "payTo is the address that receives funds; without it the service can't be paid." };
  }
  if (/^0x0+$/.test(c.payTo)) {
    return { check, severity: "fail", message: "payTo is the zero address.", why: "Funds 'sent' to 0x0 are unrecoverable." };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(c.payTo)) {
    return { check, severity: "warn", message: `payTo "${c.payTo}" is not a valid EVM address.`, why: "An invalid recipient address will fail settlement." };
  }
  return { check, severity: "pass", message: "payTo is a valid address." };
}

interface SupportedKind {
  x402Version?: number;
  scheme?: string;
  network?: string;
}

/** Live check: does the facilitator's /supported advertise your {version, scheme, network}? */
export async function checkFacilitatorSupported(c: X402Config): Promise<Finding> {
  const check = "facilitator-supported";
  if (!c.facilitatorUrl || !c.network) return { check, severity: "info", message: "facilitatorUrl or network not set — skipped." };
  const base = c.facilitatorUrl.replace(/\/$/, "");
  try {
    const res = await fetch(base + "/supported", { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      return { check, severity: "warn", message: `GET ${base}/supported returned ${res.status} — couldn't verify support (some facilitators require auth here).` };
    }
    const data = (await res.json()) as { kinds?: SupportedKind[]; supported?: SupportedKind[] };
    const kinds = data.kinds ?? data.supported ?? [];
    const ver = c.x402Version ?? networkInfo(c.network)?.x402Version;
    const match =
      Array.isArray(kinds) &&
      kinds.some(
        (k) =>
          k.network === c.network &&
          (c.scheme ? k.scheme === c.scheme : true) &&
          (ver != null ? k.x402Version === ver : true),
      );
    if (match) {
      return { check, severity: "pass", message: `Facilitator advertises network "${c.network}"${c.scheme ? ` / scheme "${c.scheme}"` : ""}.` };
    }
    return {
      check,
      severity: "fail",
      message: `Facilitator does NOT advertise your network "${c.network}"${c.scheme ? ` / scheme "${c.scheme}"` : ""} in /supported.`,
      why: "If the facilitator doesn't list your {version, scheme, network}, it can't settle your payments — check the exact strings against its /supported.",
    };
  } catch (e) {
    return { check, severity: "warn", message: `Couldn't reach ${base}/supported: ${e instanceof Error ? e.message : String(e)}.` };
  }
}
