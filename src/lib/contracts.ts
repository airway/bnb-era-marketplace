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
