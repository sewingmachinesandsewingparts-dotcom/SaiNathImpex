"use client";

import { useState } from "react";
import { AccountPageFrame } from "@/src/components/route-shells";

const quickLinks = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/security", label: "Security" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AccountPageFrame
      title="My account"
      description="A lightweight account dashboard that keeps your existing profile experience intact."
      breadcrumb={[{ href: "/", label: "Home" }, { label: "Account" }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hairline rounded-2xl bg-secondary/40 p-5 transition hover:border-copper"
          >
            <p className="font-display text-2xl">{item.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Jump to {item.label.toLowerCase()}.
            </p>
          </a>
        ))}
      </div>

      <div className="hairline rounded-3xl bg-card p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "activity", label: "Activity" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === tab.key
                  ? "bg-ink text-bone"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {activeTab === "overview"
            ? "You can manage orders, saved items, and account settings from this dashboard."
            : "Recent account activity is ready to be expanded with live order and support history."}
        </p>
      </div>
    </AccountPageFrame>
  );
}
