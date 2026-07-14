"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import axios from "axios";

export default function CategoryPage({ params }) {
  const categorySlug = params.category;
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState(categorySlug);

  useEffect(() => {
    setLoading(true);
    axios(`/api/parts?category=${encodeURIComponent(categorySlug)}`)
      .then((res) => res.data)
      .then((data) => {
        setParts(data);
        if (data && data.length) setCategoryName(data[0].categoryRoot || data[0].modelName || categorySlug);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading category parts:", err);
        setLoading(false);
      });
  }, [categorySlug]);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          /
          <Link href="/categories" className="hover:text-copper">
            {" "}
            Categories
          </Link>{" "}
          / {categoryName}
        </nav>

        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">Category</div>
            <h1 className="font-display text-6xl md:text-7xl mt-1">{categoryName}</h1>
            <p className="text-muted-foreground mt-2">{parts.length} parts</p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-0 pb-20">
          {loading ? (
            <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parts.length ? parts.map((p) => <PartCard key={p.sku} part={p} />) : <p className="text-muted-foreground col-span-full">No parts in this category.</p>}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
