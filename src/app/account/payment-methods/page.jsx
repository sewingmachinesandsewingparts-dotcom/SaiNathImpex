"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const starterMethods = [{ label: "Card ending in 4242", note: "Default payment method" }];

export default function AccountPaymentMethodsPage() {
  const [methods] = useState(starterMethods);

  return (
    <AccountPageFrame
      title="Payment methods"
      description="Saved payment methods are listed here as a simple account section."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Payment methods" }]}
    >
      <div className="space-y-3">
        {methods.map((method) => (
          <div key={method.label} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{method.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{method.note}</p>
          </div>
        ))}
      </div>
    </AccountPageFrame>
  );
}
