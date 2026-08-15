export const BSC_MAINNET = 56;
export const BSC_TESTNET = 97;

export const IDENTITY_REGISTRY: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  [BSC_TESTNET]: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
};

export const REPUTATION_REGISTRY: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  [BSC_TESTNET]: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
};

export const EXPLORER: Record<number, string> = {
  [BSC_MAINNET]: "https://bscscan.com",
  [BSC_TESTNET]: "https://testnet.bscscan.com",
};

export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? BSC_MAINNET);

export const SCAN_API_BASE =
  process.env.SCAN_API_BASE ?? "https://8004scan.io/api/v1/public";

export function agentRegistryId(chainId: number, registry = IDENTITY_REGISTRY[chainId]): string {
  return `eip155:${chainId}:${registry}`;
}

export function explorerAddress(chainId: number, address: string): string {
  return `${EXPLORER[chainId] ?? EXPLORER[BSC_MAINNET]}/address/${address}`;
}

export function explorerTx(chainId: number, hash: string): string {
  return `${EXPLORER[chainId] ?? EXPLORER[BSC_MAINNET]}/tx/${hash}`;
}

export function explorerToken(chainId: number, tokenId: string): string {
  const registry = IDENTITY_REGISTRY[chainId] ?? IDENTITY_REGISTRY[BSC_MAINNET];
  return `${EXPLORER[chainId] ?? EXPLORER[BSC_MAINNET]}/token/${registry}?a=${tokenId}`;
}

export function scanAgentUrl(chainId: number, tokenId: string): string {
  return `https://8004scan.io/agent/${chainId}/${tokenId}`;
}

/** Official BNBAgent SDK / Pieverse ERC-8183 stack (measured from bnbagent-sdk addresses.ts). */
export const COMMERCE: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0xEa4DAa3100A767e86FDed867729ae7446476EBA6",
  [BSC_TESTNET]: "0xa206c0517b6371c6638cd9e4a42cc9f02a33b0de",
};

export const EVALUATOR_ROUTER: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0x51895229e12f9876011789b04f8698af06ccd6da",
  [BSC_TESTNET]: "0xd7d36d66d2f1b608a0f943f722d27e3744f66f25",
};

export const OPTIMISTIC_POLICY: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0x9c01845705b3078aa2e8cff7520a6376fd766de5",
  [BSC_TESTNET]: "0x4f4678d4439fec812ac7674bb3efb4c8f5fb78a6",
};

/** United Stables (U) — ERC-8183 payment token on BNB Chain. */
export const PAYMENT_TOKEN: Record<number, `0x${string}`> = {
  [BSC_MAINNET]: "0xcE24439F2D9C6a2289F741120FE202248B666666",
  [BSC_TESTNET]: "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565",
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
