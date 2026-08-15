import type { PaymentRail } from "./types";

const X402 = new Set(["x402", "x402-probe", "x402_probe", "x402probe"]);
const ESCROW = new Set(["erc-8183", "erc8183", "escrow", "testnet-escrow", "testnet_escrow"]);
const MOCK = new Set(["mock-x402", "mock_x402", "mock-escrow", "mock_escrow", "mock"]);

/** Accept the rails the judge and wallets actually send. Mocks stay rejected. */
export function normalizePaymentRail(raw: string | undefined | null): PaymentRail {
  const v = (raw ?? "erc-8183").toLowerCase().trim();
  if (X402.has(v)) return "x402";
  if (ESCROW.has(v)) return "erc-8183";
  if (MOCK.has(v)) {
    throw new Error(
      "mock-x402 / mock-escrow were removed. Use paymentRail=x402 (on-chain ERC-20 transfer) or erc-8183 (AgenticCommerce fund).",
    );
  }
  throw new Error(`Unsupported payment rail "${raw}". Use x402 or erc-8183.`);
}
