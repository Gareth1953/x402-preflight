# Hacker News / Builder-Community Draft

Title:

Show HN: x402-preflight - catch silent x402 payment config failures before deploy

Post:

I built a small free MIT-licensed CLI after hitting x402 payment config issues that failed quietly rather than obviously.

It checks for a few practical traps:

- x402 v1 network names vs v2 CAIP-2 network IDs
- Base mainnet USDC EIP-712 name mismatch (`USD Coin` vs `USDC`)
- testnet/mainnet asset mix-ups
- known facilitator capability issues
- sub-cent mainnet price sanity
- malformed or missing `payTo`

Usage:

```bash
npx x402-preflight check ./config.json
```

Cloudflare Workers:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

It is not an audit and does not claim to prove settlement. It is just a preflight checker for config mistakes that can waste a lot of time.

GitHub:
https://github.com/Gareth1953/x402-preflight

npm:
https://www.npmjs.com/package/x402-preflight

I would value feedback on missing checks, especially from people experimenting with x402, Base USDC, Cloudflare Workers, MCP, or agent payment flows.
