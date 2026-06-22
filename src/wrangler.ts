// Minimal extraction of X402_* values from a wrangler.toml [vars] block — the format
// real x402-on-Cloudflare-Workers configs use. This is a targeted key extractor, NOT a
// full TOML parser; it pulls `KEY = "value"` lines for the x402 vars.

import type { X402Config } from "./types.js";

export function parseWranglerVars(toml: string): X402Config {
  const get = (key: string): string | undefined => {
    const m = toml.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']*)["']`, "m"));
    return m ? m[1] : undefined;
  };
  const cfg: X402Config = {
    network: get("X402_NETWORK"),
    asset: get("X402_ASSET"),
    assetName: get("X402_ASSET_NAME"),
    assetVersion: get("X402_ASSET_VERSION"),
    facilitatorUrl: get("X402_FACILITATOR_URL"),
    price: get("X402_PRICE"),
    payTo: get("X402_PAY_TO"),
  };
  const ver = get("X402_VERSION");
  if (ver != null && /^\d+$/.test(ver)) cfg.x402Version = Number(ver);
  return cfg;
}
