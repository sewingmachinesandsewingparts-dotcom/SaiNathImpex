"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const starterAddresses = [{ title: "Primary address", details: "42, Industrial Estate, Mumbai" }];

export default function AccountAddressesPage() {
  const [addresses] = useState(starterAddresses);

  return (
    <AccountPageFrame
      title="Address book"
      description="Address management is now presented as a simple working section."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Addresses" }]}
    >
      <div className="space-y-3">
        {addresses.map((address) => (
          <div key={address.title} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{address.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{address.details}</p>
          </div>
        ))}
      </div>
    </AccountPageFrame>
  );
}
