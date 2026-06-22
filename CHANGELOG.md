# Changelog

## v0.1.0 - 2026-06-22

Initial release.

- Added the `x402-preflight` CLI.
- Added JSON and Cloudflare Workers `wrangler.toml` config checks.
- Added checks for x402 version/network form mismatches.
- Added Base USDC EIP-712 asset domain-name validation.
- Added asset/network mismatch checks.
- Added known facilitator capability checks.
- Added optional live facilitator `/supported` checks.
- Added price sanity and `payTo` validation.
- Added library exports for `runChecks` and `hasFailures`.
- Added example good and bad configs.
