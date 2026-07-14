"use client";

import { AdminShell } from "@/src/components/admin-shell";

export default function AdminAnalytics() {
  return (
    <AdminShell title="Analytics" subtitle="Deep dive into store performance">
      <div className="hairline bg-card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="font-display text-4xl mb-4 text-muted-foreground/30">Analytics Engine</div>
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground max-w-sm">
          Advanced analytics and reporting features will be available in a future update. The
          current dashboard provides a summary of key metrics.
        </div>
      </div>
    </AdminShell>
  );
}
