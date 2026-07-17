"use client";

import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Wrench, Clock, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import { formatINR } from "@/src/lib/format";
import { useCart } from "@/src/lib/cart-context";
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

export default function Home() {
  const [parts, setParts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeSaleIndex, setActiveSaleIndex] = useState(0);
  const { cart } = useCart();

  const lastSelectedPart = cart?.length ? cart[cart.length - 1].part : null;
  const recentParts = (() => {
    const base = parts.slice(4, 8);
    if (!lastSelectedPart) return base;
    if (base.some((p) => p.sku === lastSelectedPart.sku)) return base;
    return [lastSelectedPart, ...base.slice(0, 3)];
  })();

  useEffect(() => {
    // Fetch parts
    api("/api/parts")
      .then((res) => res.data)
      .then((data) => setParts(data.slice(0, 8)))
      .catch((err) => console.error("Error loading home parts:", err));

    // Fetch brands
    api("/api/brands")
      .then((res) => res.data)
      .then((data) => setBrands(data.filter((b) => b.isBrand).slice(0, 4)))
      .catch((err) => console.error("Error loading home brands:", err));

    // Fetch sales
    api("/api/sales")
      .then((res) => res.data)
      .then((data) => setSales(data))
      .catch((err) => console.error("Error loading home sales:", err));
  }, []);

  const brandStats = useMemo(() => {
    const statsByBrand = brands.reduce((acc, brand) => {
      acc[brand.slug] = { modelCount: 0, partsCount: 0, modelSlugs: new Set() };
      return acc;
    }, {});

    parts.forEach((part) => {
      const stat = statsByBrand[part.brandSlug];
      if (!stat) return;

      stat.partsCount += 1;
      if (part.modelSlug) {
        stat.modelSlugs.add(part.modelSlug);
      }
    });

    return Object.fromEntries(
      Object.entries(statsByBrand).map(([slug, stat]) => [
        slug,
        {
          modelCount: stat.modelSlugs.size,
          partsCount: stat.partsCount,
        },
      ]),
    );
  }, [brands, parts]);

  useEffect(() => {
    if (!sales.length) return;
    const interval = setInterval(() => {
      setActiveSaleIndex((index) => (index + 1) % sales.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sales]);

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative blueprint-grid border-b border-border overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-6">
              Ludhiana · Since 1994 · Trade-grade
            </div>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85]">
              Every part.
              <br />
              Every <span className="text-copper">stitch</span>.<br />
              Shipped fast.
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              12,000+ SKUs across JUKI, SIRUBA, Brother, Jack & Pegasus. Eye guards to servo motors
              — dispatched from Punjab in 24 hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="h-12 px-6 inline-flex items-center gap-2 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em]"
              >
                Shop the catalog <ArrowRight className="h-4 w-4" />
              <Link
                href="/categories"
                className="h-12 px-6 inline-flex items-center gap-2 border border-ink hover:bg-ink hover:text-bone transition-colors font-mono text-xs uppercase tracking-[0.2em]"
              >
                Browse by category
              </Link>
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="relative aspect-square hairline bg-card overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
                alt="Sewing machine hook assembly"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-bone px-2 py-1">
                  Featured · SKU HX-48300
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase bg-ink text-bone px-2 py-1">
                  In stock × 42
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-bone/95 p-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Rotary Hook Assembly
                  </div>
                  <div className="font-display text-3xl">{formatINR(2450)}</div>
                </div>
                <Link
                  href="/part/SKU-JUKI-HX48300"
                  className="h-10 px-4 bg-ink text-bone font-mono text-[11px] uppercase tracking-[0.15em] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { Icon: Truck, h: "48-hr dispatch", s: "Pan-India" },
              { Icon: ShieldCheck, h: "OEM-grade", s: "Verified parts" },
              { Icon: Wrench, h: "Tech support", s: "Mon–Sat · 9–7" },
              { Icon: Clock, h: "30-day returns", s: "No questions" },
            ].map(({ Icon, h, s }) => (
              <div key={h} className="px-4 py-5 flex items-center gap-3">
                <Icon className="h-5 w-5 text-copper shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-[0.15em]">{h}</div>
                  <div className="text-xs text-muted-foreground">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SALE TICKER */}
      {sales.length > 0 && (
        <section className="bg-ink text-bone overflow-hidden border-y border-border">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-copper mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> HOT DEALS
                </div>
                <h2 className="font-display text-3xl md:text-4xl">Sale spotlight</h2>
                <p className="mt-2 max-w-2xl text-sm text-bone/80">
                  Promote active offers by category, brand, or price range with a compact carousel layout. Showcase one headline deal plus quick previews of the next offers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sales.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveSaleIndex(index)}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      index === activeSaleIndex ? "bg-copper" : "bg-bone/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
              <div className="group relative overflow-hidden rounded-4xl bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-linear-to-br from-copper/10 via-transparent to-ink/5 pointer-events-none" />
                <div className="relative z-10 flex flex-col justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-copper/40 bg-copper/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-copper">
                      {sales[activeSaleIndex].scope === "price_range"
                        ? "Price range"
                        : sales[activeSaleIndex].scope.replace("_", " ")}
                    </div>
                    <h3 className="font-display text-4xl leading-tight mt-5">
                      {sales[activeSaleIndex].percent}% off
                    </h3>
                    <p className="mt-3 text-lg font-semibold">{sales[activeSaleIndex].name}</p>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                      Applies to {sales[activeSaleIndex].scope === "all"
                        ? "all parts"
                        : `${sales[activeSaleIndex].scopeRef.replace("_", " ")} ${sales[activeSaleIndex].scope}`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-copper/10 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-copper">
                      Ends {new Date(sales[activeSaleIndex].endsAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={buildSaleLink(sales[activeSaleIndex])}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-copper px-5 py-3 text-[12px] uppercase tracking-[0.2em] text-copper-foreground transition hover:bg-copper/90"
                    >
                      Browse deals <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 lg:max-h-80">
                {sales
                  .slice(0, 3)
                  .map((sale, idx) => (
                    <div
                      key={sale.id}
                      className={`min-w-55 shrink-0 rounded-2xl border border-white/10 p-4 transition hover:border-copper/40 hover:bg-white/5 snap-start ${
                        idx === activeSaleIndex ? "ring-2 ring-copper/30 bg-white/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                          {sale.scope.replace("_", " ")}
                        </span>
                        <span className="font-display text-xl text-copper">{sale.percent}%</span>
                      </div>
                      <h4 className="mt-3 text-base font-semibold leading-snug">{sale.name}</h4>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {sale.scopeRef.replace("_", " ")}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-copper">
                        <span>Ends {new Date(sale.endsAt).toLocaleDateString()}</span>
                        <button
                          type="button"
                          onClick={() => setActiveSaleIndex(idx)}
                          className="font-medium hover:text-bone"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SHOP BY BRAND */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
              01 · Catalog
            </div>
            <h2 className="font-display text-5xl mt-2">Shop by brand</h2>
          </div>
          <Link
            href="/catalog"
            className="hidden md:inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] hover:text-copper"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {brands.map((b, i) => {
            const stats = brandStats[b.slug] || { modelCount: 0, partsCount: 0 };

            return (
              <Link
                key={b.slug}
                href={`/brand/${b.slug}`}
                className={`group relative aspect-square hairline bg-card overflow-hidden flex items-end p-5 hover:bg-ink hover:text-bone transition-colors ${
                  i === 0 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : ""
                }`}
              >
                <div className="relative z-10">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground group-hover:text-copper">
                    {stats.modelCount} models · {stats.partsCount} parts
                  </div>
                  <div
                    className={`font-display tracking-wide mt-1 ${i === 0 ? "text-7xl" : "text-3xl"}`}
                  >
                    {b.name}
                  </div>
                </div>
              </Link>
            );
          })}
          <Link
            href="/categories"
            className="group relative aspect-square hairline bg-copper text-copper-foreground overflow-hidden flex items-end p-5 hover:bg-ink transition-colors"
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-80">
                Universal parts
              </div>
              <div className="font-display text-3xl mt-1">Categories</div>
            </div>
          </Link>
        </div>
      </section>

      {/* HOT COLLECTION */}
      {parts.length > 0 && (
        <section className="bg-ink text-bone border-y border-border">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
                  02 · Hot collection
                </div>
                <h2 className="font-display text-5xl mt-2 text-bone">Top picks for your workshop</h2>
              </div>
              <Link
                href="/catalog"
                className="hidden md:inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-copper hover:text-bone"
              >
                Browse all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {parts.slice(0, 4).map((p) => (
                <PartCard key={p.sku} part={p} variant="dark" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECENTLY SELECTED */}
      {recentParts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
                03 · Recently selected
              </div>
              <h2 className="font-display text-5xl mt-2">Last picked parts</h2>
            </div>
            <Link
              href="/cart"
              className="hidden md:inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] hover:text-copper"
            >
              View cart <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentParts.map((p) => (
              <PartCard key={p.sku} part={p} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PARTS */}
      {parts.length > 0 && (
        <section className="bg-secondary/40 border-y border-border">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
                  04 · This week
                </div>
                <h2 className="font-display text-5xl mt-2">Workshop favourites</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {parts.slice(0, 4).map((p) => (
                <PartCard key={p.sku} part={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 grid md:grid-cols-2 gap-6">
        <div className="bg-ink text-bone p-10 ticker-stripe-none">
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-4">
            For workshops
          </div>
          <h3 className="font-display text-4xl">Bulk order pricing</h3>
          <p className="mt-3 text-sm text-bone/70 max-w-sm">
            Tiered discounts on 50+ unit orders. Dedicated account manager. GST invoices, NET-15
            terms.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-copper hover:text-bone"
          >
            Talk to sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="bg-copper text-copper-foreground p-10">
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase opacity-80 mb-4">
            Need help?
          </div>
          <h3 className="font-display text-4xl">Live tech support</h3>
          <p className="mt-3 text-sm opacity-90 max-w-sm">
            Stuck on a part number? Chat live with our parts team — average reply under 2 minutes.
          </p>
          <Link
            href="/support"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] hover:opacity-80"
          >
            Start a chat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
