"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import { formatINR } from "@/src/lib/format";
import api from "@/src/utils/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/orders")
      .then((r) => r.data)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell title="Orders" subtitle="Manage customer orders">
      {loading ? (
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading orders...
        </div>
      ) : (
        <div className="hairline bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-6 py-3 font-mono">{o.id}</td>
                  <td>{o.user}</td>
                  <td className="font-mono">{formatINR(o.total)}</td>
                  <td>
                    <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 bg-secondary inline-block">
                      {o.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{o.at}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
