"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import api from "@/src/utils/api";
import "./pagination.css";

function getBrandCode(brandLike, fallbackSlug) {
  const source = String(brandLike?.name || brandLike?.slug || fallbackSlug || "").trim();
  const letters = source.replace(/[^A-Za-z]/g, "");
  if (!letters) return "";

  const first = letters[0].toUpperCase();
  const consonants = letters.slice(1).split("").filter((char) => !/[AEIOU]/i.test(char));
  const second = consonants[0]?.toUpperCase() || letters[1]?.toUpperCase() || first;
  return `${first}${second}`;
}

function normalizeSeriesValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase();
  const prefixed = upper.match(/([A-Z]{1,6})[-\s]?([0-9]{3,8})/);
  if (prefixed) return `${prefixed[1]}-${prefixed[2]}`;

  const digitsOnly = upper.match(/\d{3,8}/)?.[0];
  if (digitsOnly) return digitsOnly;
  return upper;
}

function formatGroupLabel(groupCode, brandLike, fallbackSlug) {
  const normalized = normalizeSeriesValue(groupCode);
  if (!normalized) {
    const brandCode = getBrandCode(brandLike, fallbackSlug);
    return brandCode || "";
  }

  if (normalized.includes("-")) return normalized;
  const brandCode = getBrandCode(brandLike, fallbackSlug);
  if (!brandCode) return normalized;
  if (normalized.startsWith(brandCode)) return normalized;
  return `${brandCode}${normalized}`;
}

function extractSeriesCode(part) {
  const directCandidates = [
    part?.linkedSeries?.series,
    part?.series?.code,
    part?.series?.[0]?.code,
    part?.series,
    part?.MCG,
    part?.series?.series,
    part?.id1,
    part?.id2,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  for (const candidate of directCandidates) {
    const normalized = normalizeSeriesValue(candidate);
    if (normalized) return normalized;
  }

  const haystacks = [part?.sku, part?.name, part?.description, part?.diagramNumber, part?.id1, part?.id2, ...(part?.altPartNumbers || [])]
    .filter(Boolean)
    .map((value) => String(value));

  const match = haystacks
    .map((value) => value.match(/([A-Za-z]{1,6})(\d{3,8})/))
    .find(Boolean);

  if (match) {
    // Return full normalized code e.g. "PG-80005" not just "80005"
    return normalizeSeriesValue(`${match[1]}${match[2]}`);
  }

  return "";
}

function getGroupKey(part) {
  return extractSeriesCode(part) || part?.linkedSeries?.series || part?.MCG || part?.id1 || part?.OEM || part?.id2 || part?.sku || "";
}

export default function BrandPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const router = useRouter();

  const [brand, setBrand]   = useState(null);
  const [parts, setParts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);

  // Pagination for group entries
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 40; // groups per page
  const goToPage = (page) => setCurrentPage(Math.max(1, page));


  // Data loading effect (unconditional, runs before any early returns)
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

  // ── Group parts by the series identifier and show a brand-style label like PG80005.
  const groupingMap = {};
  for (const part of parts) {
    const key = getGroupKey(part);
    if (!key) continue;
    if (!groupingMap[key]) groupingMap[key] = [];
    groupingMap[key].push(part);
  }
  const groupEntries = Object.entries(groupingMap).sort(([a], [b]) => a.localeCompare(b));
  const ungrouped = parts.filter((p) => !getGroupKey(p));

  // Compute pagination values after grouping
  const totalGroupPages = Math.ceil(groupEntries.length / groupsPerPage);
  const displayedGroupEntries = groupEntries.slice((currentPage - 1) * groupsPerPage, currentPage * groupsPerPage);

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
              {groupEntries.length} group{groupEntries.length !== 1 ? "s" : ""} · {parts.length} parts
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* ── Group grid ── */}
        {groupEntries.length > 0 && (
          <>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-4">
              Browse by part group
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-14">
              {displayedGroupEntries.map(([groupKey, groupParts]) => {
                const displayLabel = formatGroupLabel(groupKey, brand, brandSlug);
                const firstPartWithImg = groupParts.find(p => p.images && p.images.length > 0);
                const imgSrc = firstPartWithImg?.images[0];

                return (
                  <Link
                    key={groupKey}
                    href={`/brand/${brand.slug}/${encodeURIComponent(groupKey)}`}
                    className="hairline bg-card hover:bg-ink hover:text-bone transition-colors p-5 flex flex-col gap-2 group"
                  >
                    {imgSrc && (
                      <div className="w-full aspect-[4/3] bg-white rounded-md overflow-hidden mb-2 border border-border flex items-center justify-center p-2">
                        <img src={imgSrc} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <div className="font-display text-2xl tracking-wide">{displayLabel}</div>
                      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground group-hover:text-bone/60">
                        {groupParts.length} OEM variant{groupParts.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="mt-auto pt-2 flex flex-wrap gap-1">
                      {groupParts.slice(0, 3).map((p) => {
                        const label = p.OEM || p.id2 || p.sku;
                        return label ? (
                          <span key={p.sku} className="font-mono text-[9px] bg-background/20 px-1 rounded">
                            {label}
                          </span>
                        ) : null;
                      })}
                      {groupParts.length > 3 && (
                        <span className="font-mono text-[9px] opacity-60">+{groupParts.length - 3}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Pagination controls for groups */}
            {totalGroupPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button px-3 py-1 bg-secondary/30 rounded disabled:opacity-50"
                >Prev</button>
                {(() => {
                  const pages = [];
                  const total = totalGroupPages;
                  const cur = currentPage;
                  const range = (start, end) => { for (let i = start; i <= end; i++) pages.push(i); };
                  if (total <= 7) {
                    range(1, total);
                  } else {
                    range(1, 2);
                    if (cur > 4) pages.push('...');
                    const start = Math.max(3, cur - 1);
                    const end = Math.min(total - 2, cur + 1);
                    range(start, end);
                    if (cur < total - 3) pages.push('...');
                    range(total - 1, total);
                  }
                  return pages.map((p, idx) =>
                    p === '...'
                      ? <span key={`ellipsis-${idx}`} className="px-2">...</span>
                      : <button
                          key={p}
                          onClick={() => goToPage(p)}
                          disabled={p === cur}
                          className={`pagination-button px-2 py-1 rounded ${p === cur ? 'active' : ''}`}
                        >{p}</button>
                  );
                })()}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalGroupPages}
                  className="pagination-button px-3 py-1 bg-secondary/30 rounded disabled:opacity-50"
                >Next</button>
              </div>
            )}
          </>
        )}

        {/* ── All parts (or ungrouped parts) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-3xl mb-4">
              All {brand.name} parts
              {ungrouped.length > 0 && (
                <span className="font-mono text-base text-muted-foreground ml-3">
                  ({ungrouped.length} without group)
                </span>
              )}
            </h2>
            
            {!loading && visibleCount < parts.length && (
              <Link
                href={`/brand/${brandSlug}/all`}
                className="hairline bg-background hover:bg-copper hover:text-bone hover:border-copper transition-colors px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] shrink-0 mb-4 inline-flex items-center justify-center"
              >
                View more ({parts.length - visibleCount} remaining)
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center font-mono text-xs uppercase text-muted-foreground py-10">
            Updating catalog…
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parts.length ? (
                parts.slice(0, visibleCount).map((p) => <PartCard key={p.sku} part={p} />)
              ) : (
                <p className="text-muted-foreground col-span-full">No parts listed yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
