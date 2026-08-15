"use client";

import { useState } from "react";
import { AgentCard } from "./AgentCard";
import { HireDialog } from "./HireDialog";
import type { MarketplaceAgent } from "@/lib/types";

export function HireableCard({ agent }: { agent: MarketplaceAgent }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AgentCard agent={agent} onHire={() => setOpen(true)} />
      {open && <HireDialog agent={agent} onClose={() => setOpen(false)} onHired={() => setOpen(false)} />}
    </>
  );
}
