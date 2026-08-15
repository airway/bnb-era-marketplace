import {
  agentRegistryId,
  explorerToken,
  IDENTITY_REGISTRY,
  scanAgentUrl,
} from "./contracts";
import {
  categoriesFromFits,
  classifyText,
  defaultHirePrice,
  inferProtocols,
  primaryCategory,
  readinessOf,
} from "./classify";
import type { DataSource, MarketplaceAgent, ProtocolTag } from "./types";

export interface ScanAgentRaw {
  id?: string;
  agent_id?: string;
  token_id?: string | number;
  chain_id?: number;
  contract_address?: string;
  owner_address?: string;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  x402_supported?: boolean;
  supported_protocols?: string[] | null;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string | null;
  created_tx_hash?: string | null;
  created_block_number?: number | null;
  agent_wallet?: string | null;
  tags?: string[] | null;
  categories?: string[] | null;
  services?:
    | { name?: string; endpoint?: string; version?: string }[]
    | Record<string, { endpoint?: string; version?: string }>
    | null;
  supported_trust_models?: string[] | null;
  total_feedbacks?: number | null;
  total_validations?: number | null;
  successful_validations?: number | null;
  average_score?: number | null;
  total_score?: number | null;
  raw_metadata?: {
    offchain_uri?: string | null;
    offchain_content?: {
      name?: string;
      description?: string;
      image?: string;
      active?: boolean;
      x402Support?: boolean;
      supportedTrust?: string[];
      services?: { name?: string; endpoint?: string; version?: string }[];
    };
  } | null;
}

export function normalizeScanAgent(raw: ScanAgentRaw, source: DataSource = "live"): MarketplaceAgent {
  const off = raw.raw_metadata?.offchain_content;
  const chainId = raw.chain_id ?? 56;
  const tokenId = String(raw.token_id ?? "");
  const registry = raw.contract_address ?? IDENTITY_REGISTRY[chainId];
  const name = (raw.name || off?.name || `Agent #${tokenId}`).trim();
  const description = (raw.description || off?.description || "No registration description published.").trim();
  const imageUrl = raw.image_url || off?.image || null;
  const x402 = Boolean(raw.x402_supported || off?.x402Support);
  const rawServices = raw.services ?? off?.services ?? [];
  const serviceList = Array.isArray(rawServices)
    ? rawServices
    : rawServices && typeof rawServices === "object"
      ? Object.entries(rawServices as Record<string, { endpoint?: string; version?: string }>).map(
          ([name, s]) => ({ name, endpoint: s?.endpoint, version: s?.version }),
        )
      : [];
  const services = serviceList
    .filter((s) => s?.endpoint && !String(s.endpoint).includes("{agentId}"))
    .map((s) => ({
      name: s.name ?? "service",
      endpoint: s.endpoint as string,
      version: s.version,
    }));
  const protocols = inferProtocols({
    supported: raw.supported_protocols,
    x402,
    services,
  });
  const text = `${name} ${description} ${(raw.tags ?? []).join(" ")} ${(raw.categories ?? []).join(" ")}`;
  const fits = classifyText(text);
  const categories = categoriesFromFits(fits);
  const primary = primaryCategory(fits);
  const feedbackCount = raw.total_feedbacks ?? 0;
  const validationCount = raw.total_validations ?? 0;
  const successful = raw.successful_validations ?? 0;
  const averageScore = raw.average_score ?? raw.total_score ?? 0;
  const trust = raw.supported_trust_models?.length
    ? raw.supported_trust_models
    : off?.supportedTrust ?? [];
  const tokenUri = raw.raw_metadata?.offchain_uri ?? null;

  const agent: MarketplaceAgent = {
    id: raw.agent_id ?? `${chainId}:${registry}:${tokenId}`,
    tokenId,
    chainId,
    registry,
    agentRegistry: agentRegistryId(chainId, registry as `0x${string}`),
    name,
    description,
    imageUrl,
    owner: raw.owner_address ?? "",
    agentWallet: raw.agent_wallet ?? null,
    createdAt: raw.created_at ?? null,
    createdTxHash: raw.created_tx_hash ?? null,
    createdBlock: raw.created_block_number ?? null,
    x402,
    active: raw.is_active ?? off?.active ?? true,
    verified: Boolean(raw.is_verified),
    protocols: protocols as ProtocolTag[],
    services,
    supportedTrust: trust,
    categories,
    primaryCategory: primary,
    tags: raw.tags ?? [],
    hirePriceTbnb: defaultHirePrice(primary, x402),
    hireUnit: "per job (quoted)",
    source,
    trackRecord: {
      source: feedbackCount + validationCount > 0 ? "erc-8004-reputation" : "unavailable",
      jobsCompleted: successful,
      feedbackCount,
      averageScore,
      validationCount,
      successfulValidations: successful,
      notes:
        feedbackCount + validationCount > 0
          ? "Feedback / validation counts from the ERC-8004 index. Not a simulated PnL."
          : "No feedback or validation events indexed. You are hiring an on-chain identity, not a proven score.",
    },
    explorerUrl: explorerToken(chainId, tokenId),
    scanUrl: scanAgentUrl(chainId, tokenId),
    tokenUri,
    fit: fits,
  };
  agent.readiness = readinessOf(agent);
  return agent;
}
