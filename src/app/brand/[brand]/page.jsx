"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import api from "@/src/utils/api";

export default function BrandPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const router = useRouter();

  const [brand, setBrand]   = useState(null);
  const [parts, setParts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandSlug === "others") {
      router.replace("/categories");
      return;
    }
    setLoading(true);

    Promise.all([
      api("/api/brands").then((res) => res.data),
      api(`/api/parts?brand=${brandSlug}`).then((res) => res.data),
    ])
      .then(([brands, partsData]) => {
        const found = brands.find((x) => x.slug === brandSlug);
        setBrand(found || null);
        setParts(partsData || []);
      })
      .catch((err) => console.error("Error loading brand data:", err))
      .finally(() => setLoading(false));
  }, [brandSlug]);

  if (loading && !brand) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading brand data…
        </div>
      </PageShell>
    );
  }

  if (!brand) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Brand not found
        </div>
      </PageShell>
    );
  }

  // ── Group parts by MCG (Machine Category Group) ──────────────────────────
  // Falls back to id1 for backward-compat with docs that pre-date MCG field.
  const mcgMap = {};
  for (const part of parts) {
    const key = part.MCG || part.id1 || "";
    if (!key) continue;
    if (!mcgMap[key]) mcgMap[key] = [];
    mcgMap[key].push(part);
  }
  const mcgGroups = Object.entries(mcgMap).sort(([a], [b]) => a.localeCompare(b));
  const ungrouped = parts.filter((p) => !p.MCG && !p.id1);

  return (
    <PageShell>
      {/* ── Header ── */}
      <div className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-bone/60 mb-3">
            <Link href="/" className="hover:text-copper">Home</Link>
            {" / "}
            <Link href="/catalog" className="hover:text-copper">Catalog</Link>
            {" / "}
            {brand.name}
          </nav>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
                {brand.isBrand ? "Brand" : "Category"}
              </div>
              <h1 className="font-display text-7xl md:text-8xl">{brand.name}</h1>
            </div>
            <div className="font-mono text-xs text-bone/70">
              {mcgGroups.length} MCG group{mcgGroups.length !== 1 ? "s" : ""} · {parts.length} parts
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* ── MCG Groups grid ── */}
        {mcgGroups.length > 0 && (
          <>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-4">
              Browse by MCG (Machine Category Group)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-14">
              {mcgGroups.map(([mcg, groupParts]) => (
                <Link
                  key={mcg}
                  href={`/brand/${brand.slug}/${mcg}`}
                  className="hairline bg-card hover:bg-ink hover:text-bone transition-colors p-4 flex flex-col gap-1 group"
                >
                  <div className="font-display text-2xl tracking-wide">{mcg}</div>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-hover:text-bone/60">
                    {groupParts.length} OEM variant{groupParts.length !== 1 ? "s" : ""}
                  </div>
                  {/* Show OEM pills preview */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {groupParts.slice(0, 3).map((p) => (
                      <span key={p.OEM || p.id2 || p.sku} className="font-mono text-[9px] bg-background/20 px-1 rounded">
                        {p.OEM || p.id2 || p.sku}
                      </span>
                    ))}
                    {groupParts.length > 3 && (
                      <span className="font-mono text-[9px] opacity-60">+{groupParts.length - 3}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── All parts (or ungrouped parts) ── */}
        <h2 className="font-display text-3xl mb-4">
          All {brand.name} parts
          {ungrouped.length > 0 && (
            <span className="font-mono text-base text-muted-foreground ml-3">
              ({ungrouped.length} without MCG)
            </span>
          )}
        </h2>

        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">
            Updating catalog…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts.length ? (
              parts.map((p) => <PartCard key={p.sku} part={p} />)
            ) : (
              <p className="text-muted-foreground col-span-full">No parts listed yet.</p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
