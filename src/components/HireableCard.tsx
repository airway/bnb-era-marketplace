"use client";

import { useState } from "react";
import { canShowHire } from "@/lib/featured";
import { AgentCard } from "./AgentCard";
import { HireDialog } from "./HireDialog";
import type { MarketplaceAgent } from "@/lib/types";

export function HireableCard({ agent }: { agent: MarketplaceAgent }) {
  const [open, setOpen] = useState(false);
  const hireable = canShowHire(agent);
  return (
    <>
      <AgentCard agent={agent} onHire={hireable ? () => setOpen(true) : undefined} />
      {open && hireable && <HireDialog agent={agent} onClose={() => setOpen(false)} onHired={() => setOpen(false)} />}
    </>
  );
}
