import { fundHire } from "@/lib/hire";
import { corsJson, corsOptions } from "@/lib/cors";
import type { HireRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      hireId?: string;
      hire?: HireRecord;
      jobId?: string;
      fundTxHash: string;
      registerTxHash?: string;
      budgetTxHash?: string;
      approveTxHash?: string;
      payer?: string;
    };
    if (!body.fundTxHash) throw new Error("fundTxHash required");
    const rail = body.hire?.paymentRail;
    if (rail !== "x402" && !body.jobId) throw new Error("jobId required");
    const hire = await fundHire(body);
    return corsJson({ hire });
  } catch (err) {
    return corsJson({ error: err instanceof Error ? err.message : "Fund confirm failed" }, { status: 400 });
  }
}
