# Reddit / Community Draft

Title options:

- I built a free x402 preflight checker after losing time to silent payment config failures
- x402 configs can fail silently. I made a small MIT-licensed checker for the common traps.
- Free CLI: catch x402 network, USDC domain-name, facilitator and price config mistakes before deploy

Post:

I spent time debugging an x402 payment setup where the config looked reasonable but the payment path still failed silently. The painful part was not a big implementation bug. It was small config details that are easy to miss:

- x402 v1 network names vs v2 CAIP-2 network IDs
- Base mainnet USDC EIP-712 domain name is `USD Coin`, not `USDC`
- testnet asset addresses mixed into mainnet configs
- facilitators that only support testnet being used for mainnet configs
- sub-cent pricing that may not make sense once fees are considered
- malformed or missing `payTo` addresses

I turned those checks into a small CLI:

```bash
npx x402-preflight check ./config.json
```

It can also read a Cloudflare Workers `wrangler.toml` vars block:

```bash
npx x402-preflight check ./wrangler.toml --wrangler
```

The tool is free and MIT-licensed. It was built AI-assisted, but the checks are explicit and easy to inspect. It does not audit smart contracts, signing code, or your whole x402 implementation. It only checks known config landmines that can waste debugging time.

GitHub:
https://github.com/Gareth1953/x402-preflight

npm:
https://www.npmjs.com/package/x402-preflight

I would be interested in feedback from anyone building with x402, Base USDC, Cloudflare Workers, or agent payment experiments. The most useful feedback would be:

- Which config traps have you hit?
- Are there other networks/assets/facilitators this should cover?
- Is the output useful enough for CI?
- Are any warnings too noisy?

No paid product behind this. Just a small tool that would have saved me time.
