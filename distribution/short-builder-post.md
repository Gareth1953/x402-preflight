# Short Builder Post

I built a small free MIT-licensed CLI after hitting x402 payment config issues that failed quietly instead of obviously.

It checks practical x402 config traps:

- v1 network names vs v2 CAIP-2 IDs
- Base mainnet USDC EIP-712 name mismatch (`USD Coin` vs `USDC`)
- testnet/mainnet asset mix-ups
- known facilitator capability issues
- sub-cent mainnet price sanity
- malformed or missing `payTo`

```bash
npx x402-preflight check ./config.json
```

Cloudflare Workers:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

Free, MIT-licensed, AI-assisted, and built from real mainnet debugging pain.

GitHub: https://github.com/Gareth1953/x402-preflight
npm: https://www.npmjs.com/package/x402-preflight

It is not an audit and does not guarantee settlement. It only checks known config mistakes before deploy.
