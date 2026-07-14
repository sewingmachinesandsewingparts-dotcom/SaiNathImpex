"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterCampaigns = [
  { name: "Workshop offer", status: "Live" },
  { name: "Seasonal bundle", status: "Draft" },
];

export default function AdminMarketingPage() {
  const [campaigns] = useState(starterCampaigns);

  return (
    <AdminPageFrame title="Marketing" subtitle="Campaign and promotion panel">
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.name} className="hairline rounded-3xl bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl">{campaign.name}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">{campaign.status}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
