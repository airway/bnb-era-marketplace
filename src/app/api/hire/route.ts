import { createHire, listHires } from "@/lib/hire";
import { corsJson, corsOptions } from "@/lib/cors";
import type { HireRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  return corsJson({ hires: listHires() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HireRequest;
    const hire = await createHire(body);
    return corsJson({ hire });
  } catch (err) {
    return corsJson({ error: err instanceof Error ? err.message : "Hire failed" }, { status: 400 });
  }
}
