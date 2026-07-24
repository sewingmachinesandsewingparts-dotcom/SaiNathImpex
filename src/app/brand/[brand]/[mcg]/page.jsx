"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import api from "@/src/utils/api";

export default function McgPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const mcgCode   = resolvedParams.mcg;

  const [brand, setBrand]   = useState(null);
  const [parts, setParts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]     = useState("Sort: Featured");

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api("/api/brands").then((res) => res.data),
      // Fetch parts for this brand filtered by MCG
      api(`/api/parts?brand=${brandSlug}&mcg=${encodeURIComponent(mcgCode)}`).then((res) => res.data),
    ])
      .then(([brands, partsData]) => {
        const foundBrand = brands.find((x) => x.slug === brandSlug);
        if (foundBrand) setBrand(foundBrand);
        setParts(partsData || []);
      })
      .catch((err) => console.error("Error loading MCG page data:", err))
      .finally(() => setLoading(false));
  }, [brandSlug, mcgCode]);

  // Client-side sort
  const sortedParts = [...parts].sort((a, b) => {
    if (sort === "Price: low to high") return a.price - b.price;
    if (sort === "Best rated")         return b.rating - a.rating;
    return 0;
  });

  if (loading && !brand) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading parts…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ── Header ── */}
      <div className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-14">
          {/* Breadcrumb: Home / Brand / MCG */}
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-bone/60 mb-4">
            <Link href="/" className="hover:text-copper">Home</Link>
            {" / "}
            <Link href={`/brand/${brandSlug}`} className="hover:text-copper">
              {brand?.name ?? brandSlug.toUpperCase()}
            </Link>
            {" / "}
            <span className="text-copper">{mcgCode}</span>
          </nav>

          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
                MCG · {mcgCode}
              </div>
              <h1 className="font-display text-6xl md:text-7xl">
                {brand?.name ?? brandSlug.toUpperCase()}
              </h1>
              <p className="font-mono text-bone/60 text-xs mt-3 uppercase tracking-widest">
                {parts.length} OEM variant{parts.length !== 1 ? "s" : ""}
              </p>
            </div>

            <select
              className="hairline bg-ink text-bone px-3 py-2 text-sm outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>Sort: Featured</option>
              <option>Price: low to high</option>
              <option>Best rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── OEM variant pills ── */}
      {parts.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
            OEM Numbers in this group
          </div>
          <div className="flex flex-wrap gap-2">
            {parts.map((p) =>
              p.OEM ? (
                <Link
                  key={p.OEM}
                  href={`/brand/${brandSlug}/${mcgCode}/${p.OEM}`}
                  className="hairline px-3 py-1 font-mono text-xs hover:bg-ink hover:text-bone transition-colors"
                >
                  {p.OEM}
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* ── Parts grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 pb-20">
        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">
            Updating list…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedParts.length ? (
              sortedParts.map((p) => <PartCard key={p.sku} part={p} />)
            ) : (
              <p className="text-muted-foreground col-span-full">
                No parts listed for MCG {mcgCode} yet.
              </p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
