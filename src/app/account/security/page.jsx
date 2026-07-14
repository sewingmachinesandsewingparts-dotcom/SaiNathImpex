"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

export default function AccountSecurityPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <AccountPageFrame
      title="Security"
      description="Account security options are shown as simple toggles."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Security" }]}
    >
      <div className="hairline rounded-3xl bg-card p-6">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl">Email alerts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Receive order and account notifications.
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={() => setEmailNotifications((value) => !value)}
            className="h-5 w-5"
          />
        </label>
      </div>
    </AccountPageFrame>
  );
}
