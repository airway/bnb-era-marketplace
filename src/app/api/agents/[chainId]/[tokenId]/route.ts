import { NextResponse } from "next/server";
import { getMarketplaceAgent } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ chainId: string; tokenId: string }> },
) {
  const { chainId, tokenId } = await ctx.params;
  try {
    const result = await getMarketplaceAgent(Number(chainId), decodeURIComponent(tokenId));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Not found" },
      { status: 404 },
    );
  }
}
