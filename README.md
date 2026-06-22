# x402-preflight

**Catch the silent-fail landmines in your x402 payment config — before you deploy.**

The painful thing about x402 misconfigurations is that they fail **silently**: no error, just payments that never settle and a debugging session that eats your afternoon. `x402-preflight` checks a config against the traps that actually bite — pulled from real, on-chain-verified experience taking an x402 service to Base mainnet.

```bash
npx x402-preflight check ./config.json
# or read your Cloudflare Workers config directly:
npx x402-preflight check ./wrangler.toml --wrangler
```

> **Honest note:** this tool was built AI-assisted. The proof is that it *works* — run it, read the checks, see for yourself. It's free and MIT-licensed.

## What it checks

| Check | Catches | Severity |
| --- | --- | --- |
| **network ↔ version** | x402 v1 uses chain names (`base`); v2 uses CAIP-2 (`eip155:8453`). A version/form mismatch makes the facilitator silently reject the payment. | fail |
| **asset domain name** | The EIP-712 `name` must equal the token's on-chain `name()`. **Base mainnet USDC is `"USD Coin"`, testnet is `"USDC"`** — copy the testnet value and every payer signature silently fails. | fail |
| **asset ↔ network** | A testnet asset address on a mainnet network (or vice-versa) can't settle — the token isn't there. | fail |
| **facilitator capability** | Known facilitators: `x402.org` is **testnet-only**; CDP **needs a registered business**; OpenFacilitator is open/mainnet. Flags a testnet-only facilitator on a mainnet config. | fail / warn |
| **facilitator `/supported`** (`--live`) | Calls the facilitator's `/supported` and confirms it advertises your `{version, scheme, network}`. | fail |
| **price sanity** | Sub-cent prices vs gas/fee economics — on mainnet, fees often equal or exceed a sub-cent charge. | warn |
| **payTo** | Missing, zero-address, or malformed recipient. | fail / warn |

## Example

`examples/bad.json` packs four classic mistakes at once:

```
$ npx x402-preflight check ./examples/bad.json

  x [FAIL] network-version: x402Version is 1 but network "eip155:8453" is the v2 form. For v1, use "base".
      why: x402 v1 uses chain names (base); v2 uses CAIP-2 (eip155:8453)...
  x [FAIL] asset-domain-name: assetName is "USDC" but Base mainnet USDC's on-chain name() is "USD Coin".
      why: EIP-712 domain mismatch -> every payer signature silently fails...
  x [FAIL] facilitator-capability: Facilitator x402.org is testnet-only ... but your network "eip155:8453" is mainnet.
  ! [WARN] price-sanity: Price ~$0.001 is sub-cent on mainnet.

  3 fail · 1 warn
```

`examples/good.json` passes clean. Exit code is non-zero on any fail, so it drops into CI.

## Config shape

A JSON file (or a `wrangler.toml` `[vars]` block via `--wrangler`):

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base",
  "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "assetName": "USD Coin",
  "assetVersion": "2",
  "facilitatorUrl": "https://pay.openfacilitator.io",
  "price": "$0.01",
  "payTo": "0x91e439852d308dAed7f805d3504BA4d45ea4fA68"
}
```

For `wrangler.toml`, it reads `X402_NETWORK`, `X402_ASSET`, `X402_ASSET_NAME`, `X402_ASSET_VERSION`, `X402_FACILITATOR_URL`, `X402_PRICE`, `X402_PAY_TO` (and optional `X402_VERSION`).

## Use as a library

```ts
import { runChecks, hasFailures } from "x402-preflight";

const findings = await runChecks(config, { live: true });
if (hasFailures(findings)) process.exit(1);
```

## Scope (what it is and isn't)

x402-preflight catches **configuration** landmines that fail silently. It does **not** audit your x402 *implementation*, your smart contracts, or your signing code — it checks that the config you're about to ship is internally coherent and matches the known on-chain facts. Currently focused on **Base / EVM USDC**; the knowledge base is small and explicit (see `src/knowledge.ts`) and easy to extend via PR.

## License

MIT © Gareth1953
