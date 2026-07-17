"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageShell } from "@/src/components/site-shell";
import { formatINR } from "@/src/lib/format";
import { Package, Search } from "lucide-react";
import api from '@/src/utils/api';

const statusStyles = {
  placed: "bg-secondary text-foreground",
  shipped: "bg-copper text-copper-foreground",
  delivered: "bg-success text-bone",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupEmail, setLookupEmail] = useState("");

  const fetchOrders = (email = "") => {
    setLoading(true);
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    api(`/api/orders${query}`)
      .then((res) => res.data)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    fetchOrders(lookupEmail);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Orders
        </nav>
        <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-6xl">Your orders</h1>
            <p className="text-muted-foreground mt-2">{orders.length} orders found</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Link
              href="/track-order"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground hover:border-copper hover:text-copper"
            >
              Track order
            </Link>
            {/* Email filter lookup */}
          </div>
          <form
            onSubmit={handleLookupSubmit}
            className="flex hairline bg-card focus-within:border-copper max-w-xs w-full"
          >
            <input
              type="email"
              placeholder="Filter by email address..."
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              className="bg-transparent px-3 py-2 text-xs outline-none flex-1"
            />
            <button
              type="submit"
              className="px-3 bg-ink text-bone cursor-pointer hover:bg-copper transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {loading ? (
          <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Connecting to order databases...
          </div>
        ) : orders.length === 0 ? (
          <div className="hairline bg-card p-12 text-center flex flex-col items-center gap-4">
            <Package className="h-12 w-12 text-muted-foreground" />
            <div className="font-display text-2xl">No orders found</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              We couldn't find any orders placed. Check the email filter or catalog.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="hairline bg-card p-5 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                    Order
                  </div>
                  <div className="font-display text-2xl tracking-wide">{o.id}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    Placed {o.placedAt}
                  </div>
                  {o.customerEmail && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {o.customerEmail}
                    </div>
                  )}
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                    Items
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Package className="h-3.5 w-3.5" /> {o.itemsCount}
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                    Total
                  </div>
                  <div className="font-mono">{formatINR(o.total)}</div>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <span
                    className={`inline-block font-mono text-[10px] tracking-widest uppercase px-2 py-1 ${statusStyles[o.status] || "bg-secondary"}`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="col-span-6 sm:col-span-2 sm:text-right">
                  <Link
                    href={`/orders/${encodeURIComponent(o.id)}/invoice`}
                    className="font-mono text-[11px] uppercase tracking-widest hover:text-copper"
                  >
                    View invoice →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
