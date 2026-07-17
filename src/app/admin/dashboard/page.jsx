"use client";

import { useEffect, useState } from "react";
import api from "@/src/utils/api";
import { AdminPageFrame } from "@/src/components/route-shells";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api
      .get("/api/admin/dashboard")
      .then((res) => setSummary(res.data))
  }, []);

  return (
    <AdminPageFrame title="Dashboard" subtitle="Operational summary dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Revenue",
            value: summary?.kpis?.revenueWeek
              ? `₹${summary.kpis.revenueWeek.toLocaleString("en-IN")}`
              : "—",
          },
          { label: "Orders", value: summary?.kpis?.ordersWeek ?? "—" },
          { label: "Low stock", value: summary?.kpis?.lowStock ?? "—" },
        ].map((item) => (
          <div key={item.label} className="hairline rounded-3xl bg-card p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 font-display text-3xl">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="hairline rounded-3xl bg-card p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Recent activity</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {summary
            ? "Dashboard metrics are now being loaded from the existing admin API."
            : "No dashboard data returned yet."}
        </p>
      </div>
    </AdminPageFrame>
  );
}
