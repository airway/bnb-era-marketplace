import { NextResponse } from "next/server";
import { notifyHire } from "@/lib/hire";
import type { HireRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { hireId?: string; hire?: HireRecord; jobId: string };
    if (!body.jobId) throw new Error("jobId required");
    const hire = await notifyHire(body);
    return NextResponse.json({ hire });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "notify_funded failed" },
      { status: 400 },
    );
  }
}
