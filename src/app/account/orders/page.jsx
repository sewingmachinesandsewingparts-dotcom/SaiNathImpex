"use client";

import { useEffect, useState } from "react";
import api from "@/src/utils/api";
import { AccountPageFrame } from "@/src/components/route-shells";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/orders")
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AccountPageFrame
      title="Order history"
      description="Recent orders are loaded from the existing orders API."
      breadcrumb={[{ href: "/account", label: "Account" }, { label: "Orders" }]}
    >
      {loading ? (
        <div className="hairline rounded-3xl bg-card p-6 text-sm text-muted-foreground">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="hairline rounded-3xl bg-card p-6 text-sm text-muted-foreground">
          No orders found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="hairline rounded-3xl bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                    {order.status}
                  </p>
                  <p className="font-display text-xl">
                    ₹{Number(order.total || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountPageFrame>
  );
}
