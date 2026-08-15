import { NextResponse } from "next/server";
import { createHire, listHires } from "@/lib/hire";
import type { HireRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ hires: listHires() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HireRequest;
    const hire = await createHire(body);
    return NextResponse.json({ hire });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Hire failed" },
      { status: 400 },
    );
  }
}
