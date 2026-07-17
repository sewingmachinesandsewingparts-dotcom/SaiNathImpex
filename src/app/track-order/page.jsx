"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { Package, Search, Clock3, MapPin, Truck, CheckCircle, XCircle } from "lucide-react";
import api from "@/src/utils/api";

const statusSteps = [
  { status: "placed", label: "Order placed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
  { status: "cancelled", label: "Cancelled" },
];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchOrder = async (query) => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api(`/api/orders${query}`);
      if (Array.isArray(data) && data.length > 0) {
        setOrder(data[0]);
        setMessage("");
      } else if (data && data.id) {
        setOrder(data);
        setMessage("");
      } else {
        setOrder(null);
        setMessage("No matching order found.");
      }
    } catch (error) {
      setOrder(null);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId && !email) {
      setMessage("Enter order ID or email to track your order.");
      return;
    }

    const query = orderId
      ? `?id=${encodeURIComponent(orderId)}`
      : email
      ? `?email=${encodeURIComponent(email)}`
      : "";

    await fetchOrder(query);
  };

  const activeStepIndex = order
    ? statusSteps.findIndex((step) => step.status === order.status)
    : -1;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Track order
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-6">
            <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <Package className="h-8 w-8 text-copper" />
                <div>
                  <h1 className="font-display text-5xl">Track your order</h1>
                  <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                    Enter your order ID or email. If you are already signed in, use your saved email to see the latest status.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="mt-8 grid gap-4">
                <div className="grid gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Order ID
                  </label>
                  <input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="ORD-2026-1001"
                    className="hairline rounded-2xl bg-background px-4 py-3 text-sm outline-none focus:border-copper"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Email address
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@workshop.in"
                    className="hairline rounded-2xl bg-background px-4 py-3 text-sm outline-none focus:border-copper"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm text-bone hover:bg-copper transition-colors"
                >
                  <Search className="h-4 w-4" /> Track order
                </button>
              </form>


              {message && (
                <div className="mt-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {message}
                </div>
              )}
            </div>

            {order && (
              <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Order ID
                    </div>
                    <div className="font-display text-3xl tracking-tight mt-2">{order.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Status
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-copper/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-copper">
                      {order.status}
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-border p-4 text-sm">
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Placed</div>
                      <div className="mt-2">{order.placedAt}</div>
                    </div>
                    <div className="rounded-3xl border border-border p-4 text-sm">
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</div>
                      <div className="mt-2">{order.customerEmail}</div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border p-4 text-sm">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Shipping address</div>
                    <div className="mt-2 whitespace-pre-line">{order.shippingAddress || "Not provided"}</div>
                  </div>
                </div>

                <div className="mt-10">
                  <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Tracking progress
                  </div>
                  <div className="space-y-4">
                    {statusSteps.map((step, index) => {
                      const isActive = index <= activeStepIndex;
                      const isCurrent = index === activeStepIndex;
                      return (
                        <div key={step.status} className="flex gap-4">
                          <div
                            className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${
                              isActive ? "border-copper bg-copper/10 text-copper" : "border-border text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                              {step.label}
                            </div>
                            <div className={`mt-2 text-sm ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                              {isActive
                                ? index === activeStepIndex
                                  ? "Current step"
                                  : "Completed"
                                : "Pending"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-copper" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Fast order updates
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Track your latest order by order ID or email. If you are signed in, your session cookie keeps you authenticated.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-4xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-copper" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Order updates
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Status changes appear in a simple animated progress list so you can see if your order is still placed, shipped, or delivered.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-4xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-copper" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Need help?
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Contact support if your order status remains unchanged or you cannot find your order ID.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
