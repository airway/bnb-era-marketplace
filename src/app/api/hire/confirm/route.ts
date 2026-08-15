import { NextResponse } from "next/server";
import { confirmHire } from "@/lib/hire";
import type { HireRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      hireId?: string;
      hire?: HireRecord;
      createTxHash: string;
      jobId?: string;
      payer?: string;
    };
    if (!body.createTxHash) throw new Error("createTxHash required");
    const hire = await confirmHire(body);
    return NextResponse.json({ hire });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirm failed" },
      { status: 400 },
    );
  }
}
