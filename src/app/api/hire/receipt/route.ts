import { NextResponse } from "next/server";
import { fetchTxReceipt } from "@/lib/chain";
import { COMMERCE } from "@/lib/contracts";
import { parseJobCreatedId } from "@/lib/erc8183";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { txHash?: string; chainId?: number };
    if (!body.txHash) throw new Error("txHash required");
    const receipt = await fetchTxReceipt(body.txHash);
    if (!receipt) return NextResponse.json({ jobId: null, pending: true });
    if (receipt.status === "0x0") throw new Error("Transaction reverted");
    const commerce = COMMERCE[body.chainId ?? 56] ?? COMMERCE[56];
    const jobId = parseJobCreatedId(receipt.logs, commerce);
    return NextResponse.json({ jobId, pending: false, status: receipt.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Receipt read failed" },
      { status: 400 },
    );
  }
}
