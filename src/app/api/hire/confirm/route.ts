import { confirmHire } from "@/lib/hire";
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
      createTxHash: string;
      jobId?: string;
      payer?: string;
    };
    if (!body.createTxHash) throw new Error("createTxHash required");
    const hire = await confirmHire(body);
    return corsJson({ hire });
  } catch (err) {
    return corsJson({ error: err instanceof Error ? err.message : "Confirm failed" }, { status: 400 });
  }
}
