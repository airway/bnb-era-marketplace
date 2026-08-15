import { NextResponse } from "next/server";
import { listMarketplaceAgents } from "@/lib/query";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const category = (url.searchParams.get("category") as CategoryId | "all") || "all";
  const x402 = url.searchParams.get("x402") === "1";
  const hideSpam = url.searchParams.get("hideSpam") !== "0";
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "24");
  const sort =
    (url.searchParams.get("sort") as "newest" | "price" | "score" | "name" | "fit") || "newest";

  const result = await listMarketplaceAgents({
    q,
    category,
    x402,
    hideSpam,
    page,
    limit,
    sort,
    preferLive: url.searchParams.get("preferLive") !== "0",
  });
  return NextResponse.json(result);
}
