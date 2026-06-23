# DEV-003 Distribution Pack for x402-preflight

## Positioning Notes

x402-preflight is a free, MIT-licensed CLI for checking x402 payment configuration before deployment. It was built AI-assisted from real Base mainnet debugging pain: payment configs that look valid but silently fail because one small network, asset, facilitator, or EIP-712 detail is wrong.

The distribution goal is useful builder-to-builder awareness, not a consulting pitch. Share the tool where people are already discussing x402, AI-agent payments, Cloudflare Workers, Base, USDC, EIP-712, MCP, or developer tooling.

## 1. Reddit / Community Post Draft

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

## 2. dev.to Article Draft

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

## 3. Hacker News / Builder-Community Version

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

## 4. Suitable Places To Share Without Spam

Use only communities where the post adds practical technical value. Do not repost the same wording everywhere. Adapt each post to the audience and avoid repeated self-promotion.

### Good-fit places

- GitHub repository README and release notes.
- npm package README.
- dev.to article.
- Hacker News Show HN, once, if the GitHub repo is polished.
- Reddit communities where rules allow tool sharing:
  - r/webdev
  - r/node
  - r/ethdev
  - r/base
  - r/defi, only if the post is technical and not promotional
  - r/cloudflare, only if framed around Workers config checks
  - r/LocalLLaMA or AI-agent communities only if discussing agent payment tooling and rules permit links
- Base developer community spaces, if tool sharing is allowed.
- Cloudflare Workers developer communities, if framed around `wrangler.toml` safety checks.
- x402-related GitHub discussions or issue threads, only when directly relevant and helpful.
- MCP / AI-agent builder communities, only when the discussion is specifically about agent payments or payment-gated tools.
- Personal LinkedIn post from Gareth, short and technical.
- X/Twitter builder post, if used, with one concise example and no hype.

### Avoid

- Posting in unrelated crypto price/speculation communities.
- Posting in legal, recruitment, or GLIRN communities.
- Mass posting identical text.
- Commenting links into unrelated threads.
- Direct messages to strangers.
- Cold outreach.
- Claiming the tool solves x402 generally.
- Claiming the tool makes agent payments profitable.

## 5. 7-Day Measurement Checklist

Record metrics once per day for seven days after sharing. Keep the goal modest: find whether builders understand the pain and whether the tool earns attention.

### Daily metrics

- GitHub stars:
  - Day 0 baseline:
  - Day 1:
  - Day 2:
  - Day 3:
  - Day 4:
  - Day 5:
  - Day 6:
  - Day 7:
- GitHub issues opened:
- GitHub pull requests opened:
- GitHub forks:
- npm downloads:
- README badge / CI status healthy:
- Release page views, if available:
- Replies/comments:
- Useful technical questions:
- Reports of missing checks:
- Reports that it caught a real issue:
- Requests for additional networks/assets:
- Requests for paid features:
- Negative feedback:
- Confusion points:

### Qualitative questions to track

- Do people immediately understand the silent-fail problem?
- Do people ask for more config checks?
- Do people ask for CI examples?
- Do people ask for more facilitators/networks?
- Do people question the USDC domain-name check?
- Do people object to AI-assisted development?
- Do people see this as useful but too narrow?

### 7-day signal levels

Weak signal:

- 0-5 GitHub stars.
- No issues.
- No useful questions.
- No npm download movement.
- No one mentions a real x402 config problem.

Moderate signal:

- 5-25 GitHub stars.
- 1-3 useful questions or issues.
- Some npm downloads.
- At least one request for another network, asset, or facilitator.

Strong signal:

- 25+ GitHub stars.
- 3+ useful issues or PRs.
- Someone reports that the tool caught a real config problem.
- Someone asks for CI integration or more checks.
- npm downloads continue after the initial posting day.

## 6. Do Not Overclaim Guidance

Use restrained language.

### Safe wording

- "Checks known x402 configuration landmines."
- "Can help catch silent-fail config mistakes before deployment."
- "Focused on Base / EVM USDC knowledge currently."
- "Free and MIT-licensed."
- "Built AI-assisted from real debugging pain."
- "Not an audit."
- "Useful as a CI preflight check."

### Avoid wording

- "Prevents all x402 failures."
- "Guarantees payment settlement."
- "Makes agent payments profitable."
- "Audits your x402 implementation."
- "Secures your payment system."
- "Production-safe by default."
- "Complete x402 validator."
- "Supports every network."
- "Solves agent payments."
- "Best x402 tool."

### Important disclaimer to repeat when relevant

x402-preflight checks configuration coherence against a small explicit knowledge base. It does not audit smart contracts, signing code, payment middleware, custody, legal compliance, or facilitator reliability. Passing checks means the config avoided known mistakes; it does not guarantee settlement or profitability.
