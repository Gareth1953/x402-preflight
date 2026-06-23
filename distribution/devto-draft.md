# dev.to Article Draft

Title:

The x402 Config Mistakes That Can Silently Break Agent Payments

Subtitle:

I built a free MIT-licensed CLI to catch the network, USDC, facilitator and pricing traps before deploy.

Article:

When I started testing x402 payments on Base mainnet, the hardest failures were not dramatic errors. They were quiet mismatches.

The config looked plausible. The code path seemed reasonable. But settlement did not behave as expected, and the debugging loop became slower than it should have been.

This is the class of problem `x402-preflight` is meant to catch.

It is a small CLI:

```bash
npx x402-preflight check ./config.json
```

Or, for a Cloudflare Workers project:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

It is free, MIT-licensed, and built AI-assisted from real mainnet debugging pain.

## The silent-fail traps

### 1. x402 version and network format mismatch

x402 v1 uses chain names such as:

```text
base
```

x402 v2 uses CAIP-2-style IDs such as:

```text
eip155:8453
```

Mixing the version and network format can leave you with a config that looks close enough to be missed in review, but wrong enough to fail.

### 2. Base mainnet USDC is `USD Coin`

For EIP-712 signing, the asset domain name has to match the token's on-chain `name()`.

On Base mainnet, USDC's name is:

```text
USD Coin
```

On testnet examples, people often see:

```text
USDC
```

Copying the testnet value into a mainnet config is a small mistake with painful consequences.

### 3. Testnet and mainnet assets get mixed

It is easy to paste a testnet USDC address while configuring a mainnet network, or the other way around.

The CLI checks known asset/network combinations for the small knowledge base it currently supports.

### 4. Facilitator capability matters

Not every facilitator supports every network and mode.

The CLI includes static checks for known facilitator capability traps and can optionally call a facilitator's `/supported` endpoint:

```bash
npx x402-preflight check ./config.json --live
```

### 5. Sub-cent pricing may not make sense on mainnet

Some x402 examples naturally use tiny prices. On mainnet, fees and facilitator economics can make very small prices unrealistic. The CLI warns when pricing looks likely to be eaten by fees.

## Example output

The repository includes an intentionally bad config:

```bash
npx x402-preflight check ./examples/bad.json
```

That produces failures for:

- network/version mismatch
- USDC asset domain-name mismatch
- facilitator capability mismatch

and a warning for sub-cent pricing.

The command exits non-zero on failures, so it can be used in CI.

## What this is not

This is not a security audit.

It does not verify your smart contracts.

It does not prove your x402 implementation is correct.

It does not promise settlement.

It only checks a small set of known configuration mistakes that can waste time.

## Why I made it

The x402 ecosystem is still early. Agent payments, API payments and machine-to-machine payment flows are interesting, but the practical developer experience still depends on getting small details right.

If this catches one bad config before someone deploys, it has done its job.

GitHub:
https://github.com/Gareth1953/x402-preflight

npm:
https://www.npmjs.com/package/x402-preflight

Feedback welcome, especially from anyone using x402 with Base, USDC, Cloudflare Workers, MCP tools, or AI-agent payment experiments.
