"use client";

import { useState } from "react";
import { AdminPageFrame } from "@/src/components/route-shells";

export default function AdminSecurityPage() {
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <AdminPageFrame title="Security" subtitle="Secure access controls">
      <div className="hairline rounded-3xl bg-card p-6">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl">Two-factor authentication</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Require an extra verification step for admin access.
            </p>
          </div>
          <input
            type="checkbox"
            checked={twoFactor}
            onChange={() => setTwoFactor((value) => !value)}
            className="h-5 w-5"
          />
        </label>
      </div>
    </AdminPageFrame>
  );
}
