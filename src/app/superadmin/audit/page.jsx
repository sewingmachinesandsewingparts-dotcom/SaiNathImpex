"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterAuditItems = [
  { action: "Password reset", actor: "Ava Singh" },
  { action: "Permission update", actor: "Rohan Patel" },
];

export default function SuperAdminAuditPage() {
  const [auditItems] = useState(starterAuditItems);

  return (
    <AdminPageFrame title="Audit" subtitle="Audit trail overview">
      <div className="space-y-3">
        {auditItems.map((item) => (
          <div key={item.action} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{item.action}</p>
            <p className="mt-1 text-sm text-muted-foreground">Actor: {item.actor}</p>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
