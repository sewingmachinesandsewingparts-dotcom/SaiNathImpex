"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const starterItems = [
  { label: "Needle bar assembly", note: "Saved for later review" },
  { label: "Feed dog kit", note: "Preferred for maintenance" },
];

export default function AccountWishlistPage() {
  const [items] = useState(starterItems);

  return (
    <AccountPageFrame
      title="Wishlist"
      description="Saved items are shown here with a simple local list for now."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Wishlist" }]}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="hairline rounded-3xl bg-card p-5">
            <p className="font-display text-2xl">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>
    </AccountPageFrame>
  );
}
