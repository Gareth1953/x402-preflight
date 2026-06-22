import { describe, it, expect } from "vitest";
import {
  checkNetworkVersion,
  checkAssetDomainName,
  checkAssetNetwork,
  checkFacilitatorCapability,
  checkPrice,
  checkPayTo,
  priceToDollars,
  runChecks,
  hasFailures,
} from "../src/index.js";

const MAINNET_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TESTNET_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const WALLET = "0x91e439852d308dAed7f805d3504BA4d45ea4fA68";

describe("network-version", () => {
  it("passes v1 + base", () => expect(checkNetworkVersion({ x402Version: 1, network: "base" }).severity).toBe("pass"));
  it("passes v2 + eip155:8453", () => expect(checkNetworkVersion({ x402Version: 2, network: "eip155:8453" }).severity).toBe("pass"));
  it("fails v1 + eip155:8453 (wrong form)", () => expect(checkNetworkVersion({ x402Version: 1, network: "eip155:8453" }).severity).toBe("fail"));
  it("fails v2 + base (wrong form)", () => expect(checkNetworkVersion({ x402Version: 2, network: "base" }).severity).toBe("fail"));
  it("info when version omitted", () => expect(checkNetworkVersion({ network: "base" }).severity).toBe("info"));
});

describe("asset-domain-name", () => {
  it("passes mainnet USDC with 'USD Coin'", () => expect(checkAssetDomainName({ asset: MAINNET_USDC, assetName: "USD Coin" }).severity).toBe("pass"));
  it("FAILS mainnet USDC with 'USDC' (the classic trap)", () => expect(checkAssetDomainName({ asset: MAINNET_USDC, assetName: "USDC" }).severity).toBe("fail"));
  it("passes testnet USDC with 'USDC'", () => expect(checkAssetDomainName({ asset: TESTNET_USDC, assetName: "USDC" }).severity).toBe("pass"));
  it("warns when assetName omitted for a known asset", () => expect(checkAssetDomainName({ asset: MAINNET_USDC }).severity).toBe("warn"));
  it("fails on wrong assetVersion", () => expect(checkAssetDomainName({ asset: MAINNET_USDC, assetName: "USD Coin", assetVersion: "1" }).severity).toBe("fail"));
});

describe("asset-network", () => {
  it("passes mainnet USDC on base", () => expect(checkAssetNetwork({ asset: MAINNET_USDC, network: "base" }).severity).toBe("pass"));
  it("fails mainnet USDC on base-sepolia", () => expect(checkAssetNetwork({ asset: MAINNET_USDC, network: "base-sepolia" }).severity).toBe("fail"));
  it("fails testnet USDC on base", () => expect(checkAssetNetwork({ asset: TESTNET_USDC, network: "base" }).severity).toBe("fail"));
});

describe("facilitator-capability", () => {
  it("FAILS x402.org on a mainnet network (testnet-only)", () => expect(checkFacilitatorCapability({ facilitatorUrl: "https://x402.org/facilitator", network: "base" }).severity).toBe("fail"));
  it("passes openfacilitator on mainnet", () => expect(checkFacilitatorCapability({ facilitatorUrl: "https://pay.openfacilitator.io", network: "base" }).severity).toBe("pass"));
  it("warns on CDP (needs a business)", () => expect(checkFacilitatorCapability({ facilitatorUrl: "https://api.cdp.coinbase.com/platform/v2/x402", network: "base" }).severity).toBe("warn"));
  it("passes x402.org on a testnet network", () => expect(checkFacilitatorCapability({ facilitatorUrl: "https://x402.org/facilitator", network: "base-sepolia" }).severity).toBe("pass"));
});

describe("price-sanity", () => {
  it("warns on sub-cent ($0.001)", () => expect(checkPrice({ price: "$0.001", network: "base" }).severity).toBe("warn"));
  it("passes one cent ($0.01)", () => expect(checkPrice({ price: "$0.01" }).severity).toBe("pass"));
  it("warns on atomic 1000 (= $0.001)", () => expect(checkPrice({ price: "1000" }).severity).toBe("warn"));
  it("priceToDollars parses formats", () => {
    expect(priceToDollars("$0.01")).toBe(0.01);
    expect(priceToDollars("0.02")).toBe(0.02);
    expect(priceToDollars("10000")).toBe(0.01);
    expect(priceToDollars("nonsense")).toBeNull();
  });
});

describe("pay-to", () => {
  it("fails the zero address", () => expect(checkPayTo({ payTo: "0x0000000000000000000000000000000000000000" }).severity).toBe("fail"));
  it("passes a valid address", () => expect(checkPayTo({ payTo: WALLET }).severity).toBe("pass"));
  it("warns on a malformed address", () => expect(checkPayTo({ payTo: "0xnope" }).severity).toBe("warn"));
});

describe("runChecks (integration)", () => {
  it("flags the classic mainnet mistake (testnet name + wrong network form + testnet facilitator)", async () => {
    const findings = await runChecks({
      x402Version: 1,
      network: "eip155:8453",
      asset: MAINNET_USDC,
      assetName: "USDC",
      facilitatorUrl: "https://x402.org/facilitator",
      price: "$0.001",
      payTo: WALLET,
    });
    expect(hasFailures(findings)).toBe(true);
    // at least: network-version, asset-domain-name, facilitator-capability all fail
    const fails = findings.filter((f) => f.severity === "fail").map((f) => f.check);
    expect(fails).toContain("network-version");
    expect(fails).toContain("asset-domain-name");
    expect(fails).toContain("facilitator-capability");
  });

  it("passes a correct Base-mainnet config", async () => {
    const findings = await runChecks({
      x402Version: 1,
      scheme: "exact",
      network: "base",
      asset: MAINNET_USDC,
      assetName: "USD Coin",
      assetVersion: "2",
      facilitatorUrl: "https://pay.openfacilitator.io",
      price: "$0.01",
      payTo: WALLET,
    });
    expect(hasFailures(findings)).toBe(false);
  });
});
