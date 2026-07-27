"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import api from '@/src/utils/api';

export default function BrandAllPartsPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;

  const [brand, setBrand] = useState(null);
  const [parts, setParts] = useState([]);
  const [sort, setSort] = useState("Sort: Featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load brand details
    api("/api/brands")
      .then((res) => res.data)
      .then((brands) => {
        const found = brands.find((x) => x.slug === brandSlug);
        setBrand(found || null);
      })
      .catch((err) => console.error("Error loading brand:", err));
  }, [brandSlug]);

  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.set("brand", brandSlug);

    // Map sort string to parameter
    let sortVal = "featured";
    if (sort === "Price: low to high") sortVal = "price_asc";
    if (sort === "Price: high to low") sortVal = "price_desc";
    if (sort === "Newest") sortVal = "newest";
    if (sort === "Best rated") sortVal = "rating";
    queryParams.set("sort", sortVal);

    api(`/api/parts?${queryParams.toString()}`)
      .then((res) => res.data)
      .then((data) => {
        setParts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading parts:", err);
        setLoading(false);
      });
  }, [brandSlug, sort]);

  return (
    <PageShell>
      <div className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-bone/60 mb-3">
            <Link href="/" className="hover:text-copper">Home</Link>
            {" / "}
            <Link href="/catalog" className="hover:text-copper">Catalog</Link>
            {" / "}
            <Link href={`/brand/${brandSlug}`} className="hover:text-copper">{brand ? brand.name : brandSlug}</Link>
            {" / "}
            All Parts
          </nav>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
                All Parts
              </div>
              <h1 className="font-display text-6xl md:text-7xl">{brand ? brand.name : brandSlug}</h1>
            </div>
            <div className="font-mono text-xs text-bone/70">
              {parts.length} parts found
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-muted-foreground">
            {loading ? "Loading parts..." : `Showing all ${parts.length} parts`}
          </div>
          <select
            className="hairline bg-card px-3 py-2 text-sm outline-none cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Sort: Featured</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
            <option>Newest</option>
            <option>Best rated</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-20 bg-card hairline">
            Loading parts...
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-20 bg-card hairline">
            No parts found for this brand.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts.map((p) => (
              <PartCard key={p.sku} part={p} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
