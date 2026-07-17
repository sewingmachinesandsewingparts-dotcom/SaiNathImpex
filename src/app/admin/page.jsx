"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import { formatINR } from "@/src/lib/format";
import { TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowUpRight } from "lucide-react";
import api from "@/src/utils/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDash() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api("/api/admin/dashboard")
      .then((r) => r.data)
      .then(setDashboard)
      .catch(console.error);
  }, []);

  if (!dashboard) {
    return (
      <AdminShell title="Dashboard" subtitle="Live overview of orders, revenue, stock and support">
        <div className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-20">
          Loading dashboard data...
        </div>
      </AdminShell>
    );
  }

  const { kpis, weekly, recentOrders, issues } = dashboard;
  const max = weekly.length > 0 ? Math.max(...weekly.map((d) => d.revenue)) : 1;

  return (
    <AdminShell title="Dashboard" subtitle="Live overview of orders, revenue, stock and support">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          Icon={TrendingUp}
          label="Revenue · 7 days"
          value={formatINR(kpis.revenueWeek)}
          delta="+12.4%"
        />
        <Kpi
          Icon={ShoppingBag}
          label="Orders · 7 days"
          value={String(kpis.ordersWeek)}
          delta="+8.1%"
        />
        <Kpi
          Icon={Users}
          label="Active users"
          value={kpis.activeUsers.toLocaleString()}
          delta="+3.2%"
        />
        <Kpi
          Icon={AlertTriangle}
          label="Low stock alerts"
          value={String(kpis.lowStock)}
          delta="needs review"
          tone="warn"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 hairline bg-card p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                Revenue · this week
              </div>
              <div className="font-display text-4xl">{formatINR(kpis.revenueWeek)}</div>
            </div>
            <div className="flex gap-1 text-[10px] font-mono uppercase tracking-widest">
              {["Week", "Month", "Year"].map((t, i) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 hairline cursor-pointer ${i === 0 ? "bg-ink text-bone" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekly} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatINR(value)}
                  width={60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12 }}
                  formatter={(value, name) => [name === "revenue" ? formatINR(value) : value, name]}
                />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                <Bar yAxisId="right" dataKey="orders" barSize={20} fill="#fb923c" radius={[10, 10, 0, 0]} name="Orders" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] font-mono tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-copper inline-block rounded-full" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-secondary inline-block rounded-full" /> Orders
            </span>
          </div>
        </div>

        {/* Open issues */}
        <div className="hairline bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              Open support tickets
            </div>
            <span className="font-display text-2xl">
              {issues.filter((i) => i.status === "open").length}
            </span>
          </div>
          <div className="space-y-3">
            {issues.map((i) => (
              <div key={i.id} className="flex items-start gap-3 text-sm">
                <span
                  className={`h-2 w-2 rounded-full mt-1.5 ${i.status === "open" ? "bg-copper" : "bg-success"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{i.user}</div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {i.subject.replace("_", " ")} · {i.at}
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 hairline bg-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[11px] tracking-widest uppercase">Recent orders</div>
          <a
            className="font-mono text-[11px] uppercase tracking-widest text-copper hover:underline"
            href="/admin/orders"
          >
            View all →
          </a>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-3">Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-6 py-3 font-mono">{o.id}</td>
                <td>{o.user}</td>
                <td className="font-mono">{formatINR(o.total)}</td>
                <td>
                  <StatusPill s={o.status} />
                </td>
                <td className="text-muted-foreground">{o.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Kpi({ Icon, label, value, delta, tone }) {
  return (
    <div className="hairline bg-card p-5">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-copper" />
        <span
          className={`font-mono text-[10px] uppercase tracking-widest ${tone === "warn" ? "text-destructive" : "text-success"}`}
        >
          {delta}
        </span>
      </div>
      <div className="font-display text-3xl mt-3">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

function StatusPill({ s }) {
  const styles = {
    placed: "bg-secondary",
    shipped: "bg-copper text-copper-foreground",
    delivered: "bg-success text-bone",
    cancelled: "bg-destructive text-destructive-foreground",
  };
  return (
    <span
      className={`font-mono text-[10px] tracking-widest uppercase px-2 py-1 ${styles[s] || "bg-secondary"}`}
    >
      {s}
    </span>
  );
}
