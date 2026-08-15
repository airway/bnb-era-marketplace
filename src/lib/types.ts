export type DataSource = "live" | "snapshot" | "chain";

export type CategoryId = "rebalancing" | "grid" | "yield" | "health-factor" | "other";

export type ProtocolTag = "A2A" | "MCP" | "OASF" | "Web" | "x402" | "HTTP";

export type TrackRecordSource = "erc-8004-reputation" | "operator-status" | "unavailable";

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
}

export interface AgentTrackRecord {
  source: TrackRecordSource;
  jobsCompleted: number;
  feedbackCount: number;
  averageScore: number;
  validationCount: number;
  successfulValidations: number;
  notes: string;
}

export interface StrategyFact {
  label: string;
  value: string;
  empty?: boolean;
}

export interface StrategySnapshot {
  available: boolean;
  probedAt: string;
  sourceUrl: string | null;
  error?: string;
  facts: StrategyFact[];
  raw?: Record<string, unknown> | null;
}

export interface HireReadiness {
  hasIdentity: boolean;
  hasOwner: boolean;
  hasWallet: boolean;
  hasEndpoint: boolean;
  hasX402: boolean;
  hasFeedback: boolean;
  hasTrust: boolean;
  hasOnchainUri: boolean;
  hasLiveStrategy: boolean;
  hasA2A: boolean;
}

export interface FitBreakdown {
  category: CategoryId;
  score: number;
  matched: string[];
}

export interface MarketplaceAgent {
  id: string;
  tokenId: string;
  chainId: number;
  registry: string;
  agentRegistry: string;
  name: string;
  description: string;
  imageUrl: string | null;
  owner: string;
  agentWallet: string | null;
  createdAt: string | null;
  createdTxHash: string | null;
  createdBlock: number | null;
  x402: boolean;
  active: boolean;
  verified: boolean;
  protocols: ProtocolTag[];
  services: AgentService[];
  supportedTrust: string[];
  categories: CategoryId[];
  primaryCategory: CategoryId;
  tags: string[];
  hirePriceTbnb: number;
  hireUnit: string;
  source: DataSource;
  trackRecord: AgentTrackRecord;
  explorerUrl: string;
  scanUrl: string;
  tokenUri?: string | null;
  chainOwner?: string | null;
  chainReadAt?: string | null;
  chainReadError?: string | null;
  fit?: FitBreakdown[];
  readiness?: HireReadiness;
  strategy?: StrategySnapshot;
  a2aUrl?: string | null;
  operatorBase?: string | null;
}

export interface AgentListResult {
  agents: MarketplaceAgent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  source: DataSource;
  liveAttempted: boolean;
  warning?: string;
  capturedAt?: string;
  deskCounts?: Partial<Record<CategoryId, number>>;
}

export interface HireMandate {
  id: string;
  label: string;
  category: CategoryId;
  description: string;
  defaultBudget: number;
  fields: { id: string; label: string; placeholder: string; defaultValue: string }[];
}

export type HireStatus = "quoted" | "funded" | "working" | "submitted" | "settled" | "failed";
export type PaymentRail = "erc-8183" | "x402-probe";

export interface UnsignedTx {
  to: string;
  data: string;
  value: string;
  chainId: number;
  label: string;
}

export interface CommerceQuote {
  accepted: boolean;
  provider: string | null;
  priceRaw: string | null;
  currency: string | null;
  currencyLabel: string;
  negotiationHash: string | null;
  providerSig: string | null;
  verifyingContract: string | null;
  expiresAt: number | null;
  estimatedSeconds: number | null;
  instructions: string | null;
  a2aUrl: string | null;
  raw: unknown;
  error?: string;
}

export interface HireRecord {
  hireId: string;
  agentId: string;
  agentName: string;
  tokenId: string;
  chainId: number;
  mandateId: string;
  mandateLabel: string;
  budgetTbnb: number;
  budgetRaw: string | null;
  currency: string | null;
  paymentRail: PaymentRail;
  payer: string;
  status: HireStatus;
  createdAt: string;
  note: string;
  inputs?: Record<string, string>;
  quote?: CommerceQuote;
  txs?: UnsignedTx[];
  createTxHash?: string | null;
  fundTxHash?: string | null;
  jobId?: string | null;
  notifyResult?: string | null;
  x402?: { status: number; paymentRequired: unknown; url: string } | null;
}

export interface HireRequest {
  agentId: string;
  mandateId: string;
  budgetTbnb: number;
  paymentRail: PaymentRail;
  payer?: string;
  inputs?: Record<string, string>;
}
