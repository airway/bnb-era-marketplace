import { notifyHire } from "@/lib/hire";
import { corsJson, corsOptions } from "@/lib/cors";
import type { HireRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { hireId?: string; hire?: HireRecord; jobId: string };
    if (!body.jobId) throw new Error("jobId required");
    const hire = await notifyHire(body);
    return corsJson({ hire });
  } catch (err) {
    return corsJson({ error: err instanceof Error ? err.message : "notify_funded failed" }, { status: 400 });
  }
}
