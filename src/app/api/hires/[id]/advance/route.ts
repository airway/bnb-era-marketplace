import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Demo clock removed. Fund the ERC-8183 job on-chain, then call notify_funded with the job id.",
    },
    { status: 410 },
  );
}
