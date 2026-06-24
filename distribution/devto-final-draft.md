# x402 configs can fail silently. I made a small preflight checker for the easy-to-miss details.

When working with x402 payment configs, some of the most frustrating failures are not loud implementation errors.

They are small configuration mismatches that look plausible in review, but cause the payment flow to fail quietly or waste a lot of debugging time.

I built `x402-preflight` after running into that kind of mainnet debugging pain.

It is a small, free, MIT-licensed CLI that checks x402 config files for a few known landmines before deployment.

```bash
npx x402-preflight check ./config.json
```

It can also read a Cloudflare Workers `wrangler.toml` vars block:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

## The problem

x402 configuration has details that need to line up correctly:

- x402 version
- network format
- asset address
- asset name
- asset version
- facilitator URL
- price
- `payTo` address

If one of those is wrong, the config can still look superficially reasonable.

That is the problem this tool is trying to reduce: catching obvious known config mistakes before they become deployment-time debugging sessions.

## Examples of mistakes it checks

### Network/version mismatch

x402 v1 uses network names such as:

```text
base
```

x402 v2 uses CAIP-2-style network IDs such as:

```text
eip155:8453
```

Mixing those formats can create a config that looks close, but is not coherent for the selected x402 version.

### Base mainnet USDC asset name

For EIP-712 signing, the asset domain name matters.

On Base mainnet, USDC's on-chain name is:

```text
USD Coin
```

It is easy to copy a testnet-style value such as:

```text
USDC
```

That small difference can break signatures.

### Facilitator support mismatch

Not every facilitator supports every network or mode.

For example, using a testnet-only facilitator with a mainnet config is a practical mistake that is worth catching before deployment.

`x402-preflight` includes static checks for known facilitator support issues and can optionally call a facilitator's `/supported` endpoint:

```bash
npx x402-preflight check ./config.json --live
```

### Missing or malformed `payTo`

A missing, zero, or malformed recipient address is simple to check locally and painful to discover late.

The CLI flags obvious `payTo` issues.

### Price sanity

Sub-cent prices can be useful in examples, but on mainnet the economics may not make sense once fees and facilitator behaviour are considered.

The CLI warns when the configured price looks unusually small for mainnet use.

## What x402-preflight does

It checks a config for known x402 configuration problems, including:

- version/network form mismatches
- Base USDC asset/network mismatches
- Base mainnet USDC EIP-712 asset name issues
- known facilitator support mismatches
- optional live facilitator `/supported` checks
- price sanity warnings
- missing, zero, or malformed `payTo`

It works with JSON config files and Cloudflare Workers `wrangler.toml` vars.

The command exits non-zero when it finds failures, so it can be used in CI.

## What it does not do

This is important.

`x402-preflight` is not an audit.

It does not guarantee payment settlement.

It does not replace production testing.

It does not audit smart contracts.

It does not verify your signing implementation.

It does not provide legal or compliance advice.

It only checks a small explicit set of known configuration issues.

Passing the checks means the config avoided those known mistakes. It does not mean the full payment flow is guaranteed to work.

## How to run it

```bash
npx x402-preflight check ./config.json
```

For Cloudflare Workers:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

With live facilitator support checking:

```bash
npx x402-preflight check ./config.json --live
```

## Links

GitHub:

https://github.com/Gareth1953/x402-preflight

npm:

https://www.npmjs.com/package/x402-preflight

## Feedback wanted

I would value feedback from builders working with:

- x402
- AI agents
- Cloudflare Workers
- agent payments
- Base / USDC payment flows

The most useful feedback would be:

- Which config mistakes have you hit?
- Are any warnings too noisy?
- Which networks, assets, or facilitators should be checked next?
- Would this be useful in CI?
- Is the output clear enough when something fails?

No paid feature is being announced here. This is just a small builder tool intended to catch easy-to-miss config mistakes before they waste time.
