// Known x402 facts, encoded from real, on-chain-verified experience. These are the
// values that, when wrong, fail SILENTLY — which is exactly why this tool exists.

export interface AssetInfo {
  chainId: string; // CAIP-2
  name: string; // on-chain name() — the EIP-712 domain name payers must sign against
  version: string; // EIP-712 domain version
  label: string;
  symbol: string;
}

export interface NetworkInfo {
  chainId: string; // CAIP-2
  form: "name" | "caip2";
  x402Version: 1 | 2; // which x402 version uses this string form
  mainnet: boolean;
  canonicalName: string; // the chain-name form (v1)
}

export interface FacilitatorInfo {
  host: string;
  mainnet: boolean;
  requiresBusiness?: boolean;
  note: string;
}

// USDC deployments. EIP-712 name/version verified on-chain (name() / version()).
// NOTE the classic trap: Base mainnet USDC name() is "USD Coin", testnet is "USDC".
export const KNOWN_ASSETS: Record<string, AssetInfo> = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": {
    chainId: "eip155:8453",
    name: "USD Coin",
    version: "2",
    label: "Base mainnet USDC",
    symbol: "USDC",
  },
  "0x036cbd53842c5426634e7929541ec2318f3dcf7e": {
    chainId: "eip155:84532",
    name: "USDC",
    version: "2",
    label: "Base Sepolia USDC",
    symbol: "USDC",
  },
};

// x402 v1 uses chain NAMES; v2 uses CAIP-2 (eip155:CHAINID). Mismatch fails silently.
export const NETWORKS: Record<string, NetworkInfo> = {
  base: { chainId: "eip155:8453", form: "name", x402Version: 1, mainnet: true, canonicalName: "base" },
  "eip155:8453": { chainId: "eip155:8453", form: "caip2", x402Version: 2, mainnet: true, canonicalName: "base" },
  "base-sepolia": { chainId: "eip155:84532", form: "name", x402Version: 1, mainnet: false, canonicalName: "base-sepolia" },
  "eip155:84532": { chainId: "eip155:84532", form: "caip2", x402Version: 2, mainnet: false, canonicalName: "base-sepolia" },
};

export const FACILITATORS: FacilitatorInfo[] = [
  { host: "x402.org", mainnet: false, note: "testnet-only (Base Sepolia) — will NOT settle mainnet payments" },
  { host: "pay.openfacilitator.io", mainnet: true, note: "open, no signup/business, gas-sponsored (Base mainnet)" },
  {
    host: "api.cdp.coinbase.com",
    mainnet: true,
    requiresBusiness: true,
    note: "Coinbase CDP — requires a registered business (Coinbase Business; waitlist-only outside US/Singapore)",
  },
];

export function networkInfo(network: string | undefined): NetworkInfo | undefined {
  if (!network) return undefined;
  return NETWORKS[network.toLowerCase()];
}

export function assetInfo(asset: string | undefined): AssetInfo | undefined {
  if (!asset) return undefined;
  return KNOWN_ASSETS[asset.toLowerCase()];
}

export function facilitatorFor(url: string | undefined): FacilitatorInfo | undefined {
  if (!url) return undefined;
  try {
    const h = new URL(url).host.toLowerCase();
    return FACILITATORS.find((f) => h === f.host || h.endsWith("." + f.host));
  } catch {
    return undefined;
  }
}
