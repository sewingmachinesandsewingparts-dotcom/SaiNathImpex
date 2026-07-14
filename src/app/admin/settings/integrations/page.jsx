"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterIntegrations = [
  { name: "Google Analytics", status: "Enabled" },
  { name: "WhatsApp support", status: "Pending" },
];

export default function AdminIntegrationsPage() {
  const [integrations] = useState(starterIntegrations);

  return (
    <AdminPageFrame title="Integrations" subtitle="Third-party integrations panel">
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.name} className="hairline rounded-3xl bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl">{integration.name}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                {integration.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageFrame>
  );
}
