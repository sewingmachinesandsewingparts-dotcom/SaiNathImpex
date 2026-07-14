"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterInventory = [
  { sku: "NEEDLE-001", stock: 24, status: "Low stock" },
  { sku: "BOBBIN-002", stock: 80, status: "Healthy" },
];

export default function AdminInventoryPage() {
  const [inventory] = useState(starterInventory);

  return (
    <AdminPageFrame title="Inventory" subtitle="Inventory controls panel">
      <div className="space-y-3">
        {inventory.map((item) => (
          <div key={item.sku} className="hairline rounded-3xl bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{item.sku}</p>
                <p className="mt-1 text-sm text-muted-foreground">Stock: {item.stock}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
