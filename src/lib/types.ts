export type DataSource = "live" | "snapshot" | "reference";

export type CategoryId =
  | "monitoring"
  | "grid"
  | "health-factor"
  | "yield"
  | "trading"
  | "research"
  | "security"
  | "payments"
  | "other";

export type ProtocolTag = "A2A" | "MCP" | "OASF" | "Web" | "x402" | "HTTP";

export type TrackRecordSource =
  | "erc-8004-reputation"
  | "reference-estimated"
  | "unavailable";

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
  winRate?: number;
  notes: string;
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
}

export interface HireMandate {
  id: string;
  label: string;
  category: CategoryId;
  description: string;
  defaultBudget: number;
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
}

export interface HireRequest {
  agentId: string;
  mandateId: string;
  budgetTbnb: number;
  paymentRail: PaymentRail;
  payer?: string;
}
