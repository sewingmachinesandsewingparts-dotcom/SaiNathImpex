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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

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
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading parts:", err);
        setLoading(false);
      });
  }, [brandSlug, sort]);

  const totalPages = Math.ceil(parts.length / itemsPerPage);
  const currentParts = parts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            {loading ? "Loading parts..." : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, parts.length)} of ${parts.length}`}
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
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentParts.map((p) => (
                <PartCard key={p.sku} part={p} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-1 font-mono text-[11px] tracking-[0.15em] uppercase">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-3 hairline hover:bg-ink hover:text-bone disabled:opacity-50 disabled:pointer-events-none"
                >
                  Prev
                </button>
                {(() => {
                  const getPaginationItems = (current, total) => {
                    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
                    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
                    return [1, '...', current - 1, current, current + 1, '...', total];
                  };
                  return getPaginationItems(currentPage, totalPages).map((item, index) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="h-9 px-2 flex items-end justify-center text-muted-foreground tracking-widest">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`h-9 w-9 hairline ${item === currentPage ? "bg-ink text-bone" : "hover:bg-secondary"}`}
                      >
                        {item}
                      </button>
                    );
                  });
                })()}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 hairline hover:bg-ink hover:text-bone disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
