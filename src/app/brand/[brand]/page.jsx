"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import axios from 'axios';

export default function BrandPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const router = useRouter();

  const [brand, setBrand] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandSlug === "others") {
      router.replace("/categories");
      return;
    }
    setLoading(true);
    // Fetch brands to find current one
    axios("/api/brands")
      .then((res) => res.data)
      .then((data) => {
        const found = data.find((x) => x.slug === brandSlug);
        setBrand(found);
      })
      .catch((err) => console.error("Error loading brand data:", err));

    // Fetch parts for this brand
    axios(`/api/parts?brand=${brandSlug}`)
      .then((res) => res.data)
      .then((data) => {
        setParts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading brand parts:", err);
        setLoading(false);
      });
  }, [brandSlug]);

  if (loading && !brand) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading brand data...
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

  const partsCount = parts.length;
  const modelCounts = parts.reduce((counts, part) => {
    if (!part.modelSlug) return counts;
    counts[part.modelSlug] = (counts[part.modelSlug] || 0) + 1;
    return counts;
  }, {});

  return (
    <PageShell>
      <div className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-bone/60 mb-3">
            <Link href="/" className="hover:text-copper">
              Home
            </Link>{" "}
            /
            <Link href="/catalog" className="hover:text-copper">
              {" "}
              Catalog
            </Link>{" "}
            / {brand.name}
          </nav>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
                {brand.isBrand ? "Brand" : "Categories"}
              </div>
              <h1 className="font-display text-7xl md:text-8xl">{brand.name}</h1>
            </div>
            <div className="font-mono text-xs text-bone/70">
              {brand.models?.length || 0} {brand.isBrand ? "models" : "categories"} · {partsCount}{" "}
              parts
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-4">
          {brand.isBrand ? "Select model" : "Select category"}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
          {brand.models?.map((m) => (
            <Link
              key={m.slug}
              href={`/brand/${brand.slug}/${m.slug}`}
              className="hairline bg-card hover:bg-ink hover:text-bone transition-colors p-4 flex flex-col gap-1"
            >
              <div className="font-display text-2xl tracking-wide">{m.name}</div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                {modelCounts[m.slug] ?? m.partsCount ?? 0} parts
              </div>
            </Link>
          ))}
        </div>

        <h2 className="font-display text-3xl mb-4">All {brand.name} parts</h2>
        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">
            Updating catalog...
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
