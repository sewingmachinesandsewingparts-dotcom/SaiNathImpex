"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

const starterPreferences = [
  { label: "Order confirmations", enabled: true },
  { label: "Stock alerts", enabled: true },
  { label: "Support follow-ups", enabled: false },
];

export default function AdminNotificationsPage() {
  const [preferences, setPreferences] = useState(starterPreferences);

  const togglePreference = (index) => {
    setPreferences((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <AdminPageFrame title="Notifications" subtitle="Email and alert preferences">
      <div className="space-y-3">
        {preferences.map((preference, index) => (
          <label
            key={preference.label}
            className="flex items-center justify-between rounded-3xl border border-border bg-card p-5"
          >
            <span className="font-display text-xl">{preference.label}</span>
            <input
              type="checkbox"
              checked={preference.enabled}
              onChange={() => togglePreference(index)}
              className="h-5 w-5"
            />
          </label>
        ))}
      </div>
    </AdminPageFrame>
  );
}
