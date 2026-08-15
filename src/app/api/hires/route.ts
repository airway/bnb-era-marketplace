import { NextResponse } from "next/server";
import { listHires } from "@/lib/hire";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ hires: listHires() });
}
