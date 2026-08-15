"use client";

import { useState } from "react";
import { HireDialog } from "./HireDialog";
import type { HireRecord, MarketplaceAgent } from "@/lib/types";

export function AgentHireButton({ agent }: { agent: MarketplaceAgent }) {
  const [open, setOpen] = useState(false);
  const [hire, setHire] = useState<HireRecord | null>(null);

  return (
    <>
      <button className="btn btn-gold" style={{ width: "100%", margin: "8px 0" }} onClick={() => setOpen(true)}>
        Start hire
      </button>
      {open && (
        <HireDialog
          agent={agent}
          onClose={() => setOpen(false)}
          onHired={(h) => {
            setHire(h);
          }}
        />
      )}
      {hire && (
        <p>
          Opened <a href="/hires">{hire.hireId}</a> · {hire.status}
        </p>
      )}
    </>
  );
}
