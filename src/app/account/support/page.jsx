"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const starterTickets = [{ subject: "Replacement part request", status: "Open" }];

export default function AccountSupportPage() {
  const [tickets] = useState(starterTickets);

  return (
    <AccountPageFrame
      title="Support tickets"
      description="Support history is rendered as a working section for the account area."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Support" }]}
    >
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.subject} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{ticket.subject}</p>
            <p className="mt-1 text-sm text-muted-foreground">Status: {ticket.status}</p>
          </div>
        ))}
      </div>
    </AccountPageFrame>
  );
}
