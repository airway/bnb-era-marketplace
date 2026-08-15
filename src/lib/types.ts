export type DataSource = "live" | "snapshot" | "chain";

export type CategoryId = "rebalancing" | "grid" | "yield" | "health-factor" | "other";

export type ProtocolTag = "A2A" | "MCP" | "OASF" | "Web" | "x402" | "HTTP";

export type TrackRecordSource = "erc-8004-reputation" | "unavailable";

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

export interface HireReadiness {
  hasIdentity: boolean;
  hasOwner: boolean;
  hasWallet: boolean;
  hasEndpoint: boolean;
  hasX402: boolean;
  hasFeedback: boolean;
  hasTrust: boolean;
  hasOnchainUri: boolean;
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

export type HireStatus = "quoted" | "funded" | "working" | "submitted" | "settled";
export type PaymentRail = "mock-x402" | "mock-escrow";

export interface HireRecord {
  hireId: string;
  agentId: string;
  agentName: string;
  tokenId: string;
  chainId: number;
  mandateId: string;
  mandateLabel: string;
  budgetTbnb: number;
  paymentRail: PaymentRail;
  payer: string;
  status: HireStatus;
  createdAt: string;
  note: string;
  inputs?: Record<string, string>;
}

export interface HireRequest {
  agentId: string;
  mandateId: string;
  budgetTbnb: number;
  paymentRail: PaymentRail;
  payer?: string;
  inputs?: Record<string, string>;
}
