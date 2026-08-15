import { fetchTxReceipt } from "@/lib/chain";
import { COMMERCE } from "@/lib/contracts";
import { corsJson, corsOptions } from "@/lib/cors";
import { parseJobCreatedId } from "@/lib/erc8183";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { txHash?: string; chainId?: number };
    if (!body.txHash) throw new Error("txHash required");
    const receipt = await fetchTxReceipt(body.txHash);
    if (!receipt) return corsJson({ jobId: null, pending: true });
    if (receipt.status === "0x0") throw new Error("Transaction reverted");
    const commerce = COMMERCE[body.chainId ?? 56] ?? COMMERCE[56];
    const jobId = parseJobCreatedId(receipt.logs, commerce);
    return corsJson({ jobId, pending: false, status: receipt.status });
  } catch (err) {
    return corsJson({ error: err instanceof Error ? err.message : "Receipt read failed" }, { status: 400 });
  }
}
