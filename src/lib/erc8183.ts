import { encodeFunctionData, erc20Abi, keccak256, toBytes } from "viem";
import {
  COMMERCE,
  EVALUATOR_ROUTER,
  OPTIMISTIC_POLICY,
  PAYMENT_TOKEN,
  ZERO_ADDRESS,
} from "./contracts";
import type { CommerceQuote, UnsignedTx } from "./types";

/** keccak256("JobCreated(uint256,address,address,address,uint256,address)") */
export const JOB_CREATED_TOPIC = keccak256(
  toBytes("JobCreated(uint256,address,address,address,uint256,address)"),
);

const CREATE_JOB_ABI = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
] as const;

const SET_BUDGET_ABI = [
  {
    type: "function",
    name: "setBudget",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const FUND_ABI = [
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "expectedBudget", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const REGISTER_JOB_ABI = [
  {
    type: "function",
    name: "registerJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "policy", type: "address" },
    ],
    outputs: [],
  },
] as const;

export function buildCreateJobTx(opts: {
  chainId: number;
  provider: string;
  description: string;
  quote?: CommerceQuote;
}): UnsignedTx {
  const chainId = opts.chainId;
  const commerce = (opts.quote?.verifyingContract as `0x${string}`) || COMMERCE[chainId] || COMMERCE[56];
  const evaluator = EVALUATOR_ROUTER[chainId] || EVALUATOR_ROUTER[56];
  const expiredAt = BigInt(opts.quote?.expiresAt || Math.floor(Date.now() / 1000) + 60 * 60 * 6);
  const data = encodeFunctionData({
    abi: CREATE_JOB_ABI,
    functionName: "createJob",
    args: [
      opts.provider as `0x${string}`,
      evaluator,
      expiredAt,
      opts.description,
      ZERO_ADDRESS,
    ],
  });
  return {
    to: commerce,
    data,
    value: "0x0",
    chainId,
    label: "ERC-8183 createJob",
  };
}

export function buildApproveTx(chainId: number, amountRaw: string): UnsignedTx {
  const token = PAYMENT_TOKEN[chainId] || PAYMENT_TOKEN[56];
  const spender = COMMERCE[chainId] || COMMERCE[56];
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, BigInt(amountRaw)],
  });
  return { to: token, data, value: "0x0", chainId, label: "Approve U for escrow" };
}

export function buildSetBudgetTx(chainId: number, jobId: string, amountRaw: string): UnsignedTx {
  const data = encodeFunctionData({
    abi: SET_BUDGET_ABI,
    functionName: "setBudget",
    args: [BigInt(jobId), BigInt(amountRaw), "0x"],
  });
  return {
    to: COMMERCE[chainId] || COMMERCE[56],
    data,
    value: "0x0",
    chainId,
    label: "ERC-8183 setBudget",
  };
}

export function buildFundTx(chainId: number, jobId: string, amountRaw: string): UnsignedTx {
  const data = encodeFunctionData({
    abi: FUND_ABI,
    functionName: "fund",
    args: [BigInt(jobId), BigInt(amountRaw), "0x"],
  });
  return {
    to: COMMERCE[chainId] || COMMERCE[56],
    data,
    value: "0x0",
    chainId,
    label: "ERC-8183 fund",
  };
}

export function buildRegisterJobTx(chainId: number, jobId: string): UnsignedTx {
  const router = EVALUATOR_ROUTER[chainId] || EVALUATOR_ROUTER[56];
  const policy = OPTIMISTIC_POLICY[chainId] || OPTIMISTIC_POLICY[56];
  const data = encodeFunctionData({
    abi: REGISTER_JOB_ABI,
    functionName: "registerJob",
    args: [BigInt(jobId), policy],
  });
  return {
    to: router,
    data,
    value: "0x0",
    chainId,
    label: "ERC-8183 registerJob",
  };
}

/** Official BNBAgent sequence after createJob: registerJob → setBudget → approve → fund. */
export function buildFundSequence(chainId: number, jobId: string, amountRaw: string): UnsignedTx[] {
  return [
    buildRegisterJobTx(chainId, jobId),
    buildSetBudgetTx(chainId, jobId, amountRaw),
    buildApproveTx(chainId, amountRaw),
    buildFundTx(chainId, jobId, amountRaw),
  ];
}

export function parseJobCreatedId(
  logs: { address?: string; topics?: readonly string[] | string[] }[] | undefined,
  commerce?: string,
): string | null {
  if (!logs?.length) return null;
  for (const log of logs) {
    const topic0 = log.topics?.[0];
    if (!topic0 || topic0.toLowerCase() !== JOB_CREATED_TOPIC.toLowerCase()) continue;
    if (commerce && log.address && log.address.toLowerCase() !== commerce.toLowerCase()) continue;
    const jobTopic = log.topics?.[1];
    if (!jobTopic) continue;
    try {
      return BigInt(jobTopic).toString();
    } catch {
      continue;
    }
  }
  return null;
}

export function formatU(raw: string | null | undefined): string {
  if (!raw) return "—";
  try {
    const n = Number(BigInt(raw)) / 1e18;
    return `${n.toFixed(n >= 1 ? 2 : 4)} U`;
  } catch {
    return raw;
  }
}
