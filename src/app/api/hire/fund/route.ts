import { NextResponse } from "next/server";
import { fundHire } from "@/lib/hire";
import type { HireRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ hire });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fund confirm failed" },
      { status: 400 },
    );
  }
}
