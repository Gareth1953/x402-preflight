# Known limitations

`x402-preflight` is a focused configuration checker. It looks for a small, explicit set of known x402 configuration issues so builders can catch common mistakes earlier.

It is not an audit. It does not guarantee payment settlement, replace production testing, audit smart contracts, verify a signing implementation, or provide legal or compliance advice.

Passing the checks means only that the configuration avoided the issues currently encoded by the tool. Networks, assets, facilitator capabilities, integrations, and payment flows can change or fail for reasons outside that set of checks.

## Requesting a new check

If you encounter a repeatable x402 configuration mistake, open a GitHub issue using the **Request a new x402 check** template. Useful reports include:

- x402 version, if known
- network and whether it is mainnet, testnet, or unknown
- asset or token
- facilitator URL, when relevant
- config format: JSON or `wrangler.toml`
- a minimal config snippet with secrets and sensitive values removed
- expected behaviour
- actual `x402-preflight` output
- whether the check would be useful in CI

Repeated requests can help identify useful future checks, but not every request will be implemented. A proposed check needs to be specific, testable, and suitable for a local configuration tool.

Use the **Report a false positive or bug** template when an existing check reports something incorrect, and use **Documentation or clarity feedback** when the behaviour is correct but the explanation is unclear.
