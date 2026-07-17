"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import api from '@/src/utils/api';

export default function ModelPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const modelSlug = resolvedParams.model;

  const [brand, setBrand] = useState(null);
  const [model, setModel] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("Sort: Featured");

  useEffect(() => {
    setLoading(true);

    // Fetch both the brands info and compatible parts in parallel
    Promise.all([
      api("/api/brands").then((res) => res.data),
      api(`/api/parts?brand=${brandSlug}&model=${modelSlug}`).then((res) => res.data),
    ])
      .then(([brands, partsData]) => {
        // Resolve brand and specific model slugs
        const foundBrand = brands.find((x) => x.slug === brandSlug);
        if (foundBrand) {
          setBrand(foundBrand);
          const foundModel = foundBrand.models?.find((x) => x.slug === modelSlug);
          setModel(foundModel || null);
        }
        setParts(partsData || []);
      })
      .catch((err) => {
        console.error("Error loading model page data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [brandSlug, modelSlug]);

  // Client side sorting for simple dropdown in this specific page
  const sortedParts = [...parts].sort((a, b) => {
    if (sort === "Price: low to high") {
      return a.price - b.price;
    }
    if (sort === "Best rated") {
      return b.rating - a.rating;
    }
    return 0; // Default Featured
  });

  if (loading && !brand) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading model parts...
        </div>
      </PageShell>
    );
  }

  if (!brand || !model) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Model or category not found
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          /
          <Link href={`/brand/${brand.slug}`} className="hover:text-copper">
            {" "}
            {brand.name}
          </Link>{" "}
          / {model.name}
        </nav>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
              {brand.name}
            </div>
            <h1 className="font-display text-6xl md:text-7xl mt-1">{model.name}</h1>
            <p className="text-muted-foreground mt-2">{parts.length} compatible parts</p>
          </div>
          <select
            className="hairline bg-card px-3 py-2 text-sm outline-none"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Sort: Featured</option>
            <option>Price: low to high</option>
            <option>Best rated</option>
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20">
        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">
            Updating list...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedParts.length ? (
              sortedParts.map((p) => <PartCard key={p.sku} part={p} />)
            ) : (
              <p className="text-muted-foreground col-span-full">
                No parts listed for this {brand.isBrand ? "model" : "category"} yet.
              </p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
