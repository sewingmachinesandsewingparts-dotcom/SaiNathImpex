"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import api from "@/src/utils/api";

function buildSaleLink(sale) {
  if (!sale || !sale.scope) return "/catalog";

  switch (sale.scope) {
    case "all":
      return "/catalog";
    case "brand":
      return `/catalog?brand=${encodeURIComponent(sale.scopeRef)}`;
    case "model":
      return `/catalog?category=${encodeURIComponent(sale.scopeRef)}`;
    case "category":
      return `/catalog?category=${encodeURIComponent(sale.scopeRef)}`;
    case "stitch_type":
      return `/catalog?stitchType=${encodeURIComponent(sale.scopeRef)}`;
    case "price_range": {
      const [min, max] = (sale.scopeRef || "").split("-");
      const params = new URLSearchParams();
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
      return `/catalog?${params.toString()}`;
    }
    default:
      return "/catalog";
  }
}

export default function OffersPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/sales")
      .then((res) => res.data)
      .then((data) => setSales(data || []))
      .catch((err) => console.error("Error loading sales:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-6">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Offers
        </nav>

        <div className="mb-10">
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
            Promotions & Discounts
          </div>
          <h1 className="font-display text-5xl md:text-6xl mt-2">Active Flash Sales</h1>
        </div>

        {loading ? (
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground text-center py-20 bg-card hairline">
            Loading deals...
          </div>
        ) : sales.length === 0 ? (
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground text-center py-20 bg-card hairline">
            No active deals right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sales.map((sale) => {
              const discountPercent = sale.discountType === "percentage" ? sale.discountValue : 25;
              const link = buildSaleLink(sale);
              const claimed = sale.claimedPercent ?? 75;

              return (
                <div
                  key={sale._id || sale.id}
                  className="bg-card hairline rounded-xl border border-border relative overflow-hidden group hover:border-copper transition-colors flex flex-col justify-between"
                >
                  <div className="absolute top-4 right-4 bg-copper text-bone font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded z-10 font-bold shadow">
                    SAVE {discountPercent}%
                  </div>

                  <div className="h-64 w-full bg-white relative flex items-center justify-center p-6 border-b border-border">
                    {sale.bannerUrl ? (
                      <img
                        src={sale.bannerUrl}
                        alt={sale.title || sale.name}
                        className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="font-display text-4xl text-muted-foreground/30 uppercase tracking-wider">
                        {sale.scopeRef || "DEAL"}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-2">
                        {sale.scope ? `${sale.scope} offer` : "Flash Sale"}
                      </div>
                      <h3 className="font-display text-2xl font-bold text-ink mb-4 line-clamp-2">
                        {sale.title || sale.name}
                      </h3>

                      {/* Claimed Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                          <span>Claimed: {claimed}%</span>
                          {claimed >= 80 ? (
                            <span className="text-copper animate-pulse font-bold">Almost Gone!</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">In Stock</span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                          <div className="h-full bg-copper" style={{ width: `${claimed}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          {sale.code || "LIMITED"}
                        </div>
                        <div className="font-display text-2xl text-ink font-bold">
                          {sale.subtitle || "Special Price"}
                        </div>
                      </div>
                      <Link
                        href={link}
                        className="bg-ink text-bone font-mono text-xs uppercase tracking-[0.15em] px-5 py-3 rounded hover:bg-copper transition-colors"
                      >
                        Grab Deal
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
