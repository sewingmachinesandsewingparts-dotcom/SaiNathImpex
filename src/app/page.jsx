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
      .then((data) => setParts(data))
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
    const statsByBrand = {};

    brands.forEach((brand) => {
      statsByBrand[brand.slug] = {
        groupKeys: new Set(),
        partsCount: 0,
      };
    });

    parts.forEach((part) => {
      const partBrandSlug = part.brandSlug || (part.brandName ? part.brandName.toLowerCase().replace(/\s+/g, "-") : "");
      
      const targetSlug = Object.keys(statsByBrand).find(
        (slug) => slug === partBrandSlug || slug === part.brandSlug
      );

      if (targetSlug && statsByBrand[targetSlug]) {
        statsByBrand[targetSlug].partsCount += 1;
        const groupKey =
          part?.linkedSeries?.series ||
          part?.series?.code ||
          part?.series?.[0]?.code ||
          part?.series ||
          part?.MCG ||
          part?.id1 ||
          part?.OEM ||
          part?.id2 ||
          part?.modelSlug ||
          part?.sku ||
          "";

        if (groupKey) {
          statsByBrand[targetSlug].groupKeys.add(groupKey);
        }
      }
    });

    return Object.fromEntries(
      Object.entries(statsByBrand).map(([slug, stat]) => [
        slug,
        {
          groupCount: stat.groupKeys.size,
          partsCount: stat.partsCount,
        },
      ])
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
              </Link>
              <Link
                href="/categories"
                className="h-12 px-6 inline-flex items-center gap-2 border border-ink hover:bg-ink hover:text-bone transition-colors font-mono text-xs uppercase tracking-[0.2em]"
              >
                Browse by category
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
            const stats = brandStats[b.slug] || { groupCount: 0, partsCount: 0 };

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
                    {stats.groupCount} models · {stats.partsCount} parts
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

      {/* FLASH SALES SECTION */}
      {sales.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 border-t border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
                Limited Time Deals
              </div>
              <h2 className="font-display text-5xl mt-1">Top Deals</h2>
            </div>
            <Link
              href="/offers"
              className="font-mono text-xs uppercase tracking-[0.2em] text-copper hover:text-ink transition-colors"
            >
              View All →
            </Link>
          </div>

          {/* Top 3 Flash Deals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {sales.slice(0, 3).map((sale) => {
              const discountPercent = sale.discountType === "percentage" ? sale.discountValue : 25;
              const link = buildSaleLink(sale);
              const claimed = sale.claimedPercent ?? 75;

              return (
                <div
                  key={sale._id || sale.title}
                  className="bg-card hairline rounded-xl border border-border relative overflow-hidden group hover:border-copper transition-colors flex flex-col justify-between"
                >
                  <div className="absolute top-4 right-4 bg-copper text-bone font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded z-10 font-bold shadow">
                    SAVE {discountPercent}%
                  </div>

                  <div className="h-64 w-full bg-white relative flex items-center justify-center p-6 border-b border-border">
                    {sale.bannerUrl ? (
                      <img
                        src={sale.bannerUrl}
                        alt={sale.title}
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
                        {sale.title}
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

          {/* More Trending Sales */}
          {sales.length > 3 && (
            <>
              <h3 className="font-display text-3xl mb-6">More Trending Sales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {sales.slice(3, 7).map((sale) => (
                  <div
                    key={sale._id || sale.title}
                    className="bg-card hairline rounded-xl border border-border p-4 flex flex-col justify-between relative group hover:border-copper transition-colors"
                  >
                    <div className="absolute top-3 right-3 bg-copper text-bone font-mono text-[9px] font-bold px-2 py-1 rounded z-10">
                      -{sale.discountType === "percentage" ? sale.discountValue : 20}%
                    </div>
                    <div className="h-40 bg-white mb-4 rounded flex items-center justify-center p-3 border border-border">
                      {sale.bannerUrl ? (
                        <img
                          src={sale.bannerUrl}
                          alt={sale.title}
                          className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="font-display text-xl text-muted-foreground/40">
                          {sale.scopeRef || "SALE"}
                        </div>
                      )}
                    </div>
                    <h4 className="font-display text-lg font-bold line-clamp-2 mb-3 text-ink">
                      {sale.title}
                    </h4>
                    <Link
                      href={buildSaleLink(sale)}
                      className="mt-auto w-full text-center bg-ink text-bone hover:bg-copper font-mono text-[10px] uppercase tracking-widest py-2 rounded transition-colors"
                    >
                      View Sale
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

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
