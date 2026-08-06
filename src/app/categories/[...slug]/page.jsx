"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { formatINR } from "@/src/lib/format";
import api from "@/src/utils/api";
import { useCart } from "@/src/lib/cart-context";
import {
  Heart,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Minus,
  Plus,
  Check,
} from "lucide-react";

import "@/src/app/brand/[brand]/pagination.css";

function formatCategoryTitle(str) {
  if (!str) return "Category";
  const spaced = String(str)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function normalizeSku(value) {
  let skuValue = Array.isArray(value) ? value.join("/") : value;
  while (skuValue && /%25?2[fF]/.test(skuValue)) {
    try {
      skuValue = decodeURIComponent(skuValue);
    } catch {
      break;
    }
  }
  return skuValue;
}

export default function DynamicCategoryPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || [];

  const categorySlug = slug[0] || "";
  const brandSlug = slug[1] || "";
  const skuParam = slug.length >= 3 ? normalizeSku(slug.slice(2)) : "";

  const categoryTitle = formatCategoryTitle(categorySlug);

  // If 3+ segments, we are displaying a Part Detail page
  const isPartView = slug.length >= 3;
  // If 2 segments, we are displaying Category + Brand
  const isBrandView = slug.length === 2;

  // States for list views
  const [parts, setParts] = useState([]);
  const [allCategoryParts, setAllCategoryParts] = useState([]);
  const [allBrandsList, setAllBrandsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination for Category parts list (40 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;
  const totalPages = Math.ceil(parts.length / itemsPerPage);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const displayedParts = parts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // States for part detail view
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [part, setPart] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1); // Reset pagination on category or brand change

    if (isPartView && skuParam) {
      // Load specific part by SKU
      api(`/api/parts/${encodeURIComponent(skuParam)}`)
        .then((res) => {
          setPart(res.data);
          setLoading(false);
        })
        .catch(() => {
          // Fallback search by SKU or search param
          api(`/api/parts?q=${encodeURIComponent(skuParam)}`)
            .then((res) => {
              const found = (res.data || []).find((p) => p.sku === skuParam) || res.data?.[0];
              setPart(found || null);
            })
            .catch((err) => console.error("Error loading category part:", err))
            .finally(() => setLoading(false));
        });
    } else {
      // Fetch both full category parts and brand list so brand pills ALWAYS stay visible
      Promise.all([
        api(`/api/parts?category=${encodeURIComponent(categorySlug)}`),
        api("/api/brands").catch(() => ({ data: [] })),
      ])
        .then(([catRes, brandsRes]) => {
          const catParts = catRes.data || [];
          const bList = brandsRes.data || [];
          setAllCategoryParts(catParts);
          setAllBrandsList(bList);

          // Now filter parts for display if brandSlug is selected
          let filteredParts = catParts;
          if (brandSlug) {
            const bLower = brandSlug.toLowerCase();
            filteredParts = catParts.filter((p) => {
              const bName = (p.brandName || "").toLowerCase();
              const bSlug = (p.brandSlug || "").toLowerCase();
              const sku = (p.sku || "").toLowerCase();
              const compat = (p.compat?.machineModels || []).join(" ").toLowerCase();
              return bSlug === bLower || bName === bLower || sku.includes(bLower) || compat.includes(bLower);
            });
          }
          setParts(filteredParts);
        })
        .catch((err) => console.error("Error loading category parts:", err))
        .finally(() => setLoading(false));
    }
  }, [categorySlug, brandSlug, skuParam, isPartView]);

  // -------------------------------------------------------------
  // RENDER: Single Part Details View (3 segments: /categories/NeedlePlate/Kingtex/SKU)
  // -------------------------------------------------------------
  if (isPartView) {
    if (loading && !part) {
      return (
        <PageShell>
          <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading part details…
          </div>
        </PageShell>
      );
    }

    if (!part) {
      return (
        <PageShell>
          <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Part not found
          </div>
        </PageShell>
      );
    }

    const onSale = part.compareAt && part.compareAt > part.price;
    const wishlisted = isInWishlist(part.sku);

    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-6 flex flex-wrap items-center gap-1">
            <Link href="/" className="hover:text-copper">Home</Link>
            {" / "}
            <Link href="/categories" className="hover:text-copper">Categories</Link>
            {" / "}
            <Link href={`/categories/${categorySlug}`} className="hover:text-copper">{categoryTitle}</Link>
            {" / "}
            <Link href={`/categories/${categorySlug}/${encodeURIComponent(part.brandSlug || brandSlug || 'brand')}`} className="hover:text-copper">
              {part.brandName || brandSlug}
            </Link>
            {" / "}
            <span className="text-foreground font-semibold">{part.sku}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Gallery */}
            <div className="lg:col-span-7">
              <div className="w-full hairline bg-card overflow-hidden relative flex items-center justify-center p-4" style={{ maxHeight: 420 }}>
                <img
                  src={
                    part.images?.[activeImg] ||
                    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
                  }
                  alt={part.name}
                  className="max-h-full max-w-full object-contain object-center bg-white p-2"
                />
                {onSale && (
                  <div className="absolute top-4 left-4 bg-copper text-copper-foreground font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                    Sale
                  </div>
                )}
              </div>
              {part.images?.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {part.images.slice(0, 5).map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`aspect-square hairline overflow-hidden bg-white flex items-center justify-center p-1 ${
                        activeImg === i ? "border-ink" : ""
                      }`}
                    >
                      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buy Box */}
            <div className="lg:col-span-5">
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-2">
                {part.brandName} · {categoryTitle}
              </div>
              <h1 className="font-display text-4xl md:text-5xl leading-none">{part.name}</h1>

              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < Math.round(part.rating || 5) ? "fill-copper text-copper" : "text-border"}`}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs">SKU: {part.sku}</span>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <span className="font-display text-5xl">{formatINR(part.price)}</span>
                {onSale && (
                  <span className="font-mono text-sm line-through text-muted-foreground mb-2">
                    {formatINR(part.compareAt)}
                  </span>
                )}
                <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.15em] text-success flex items-center gap-1 mb-2">
                  <Check className="h-3.5 w-3.5" /> In stock
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="hairline flex items-center bg-card">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-12 w-12 grid place-items-center hover:bg-secondary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-mono">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="h-12 w-12 grid place-items-center hover:bg-secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => addToCart(part.sku, qty)}
                  className="flex-1 h-12 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to cart · {formatINR(part.price * qty)}
                </button>
                <button
                  onClick={() => toggleWishlist(part.sku)}
                  className={`h-12 w-12 hairline grid place-items-center transition-colors ${
                    wishlisted ? "bg-copper text-bone" : "hover:bg-ink hover:text-bone"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 divide-x divide-border hairline bg-card">
                {[
                  { Icon: Truck, h: "Fast dispatch", s: "Domestic shipping" },
                  { Icon: ShieldCheck, h: "OEM Quality", s: "Guaranteed fit" },
                  { Icon: RotateCcw, h: "Easy returns", s: "Standard policy" },
                ].map(({ Icon, h, s }) => (
                  <div key={h} className="p-3 text-center">
                    <Icon className="h-4 w-4 text-copper mx-auto mb-1.5" />
                    <div className="font-mono text-[10px] uppercase tracking-[0.15em]">{h}</div>
                    <div className="text-[11px] text-muted-foreground">{s}</div>
                  </div>
                ))}
              </div>

              {part.description && (
                <div className="mt-6 text-sm text-muted-foreground leading-relaxed">
                  {part.description}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Category List View (1 or 2 segments: /categories/NeedlePlate or /categories/NeedlePlate/Kingtex)
  // -------------------------------------------------------------
  // Construct available brands from all brands API and all parts in category
  const availableBrandsMap = {};
  for (const b of allBrandsList) {
    if (b.slug && b.name && b.slug !== "others") {
      availableBrandsMap[b.slug] = b.name;
    }
  }
  for (const p of allCategoryParts) {
    const bName = p.brandName || "Kingtex";
    const bSlug = p.brandSlug || bName;
    availableBrandsMap[bSlug] = bName;
  }
  const availableBrands = Object.entries(availableBrandsMap);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">Home</Link>
          {" / "}
          <Link href="/categories" className="hover:text-copper">Categories</Link>
          {" / "}
          {isBrandView ? (
            <>
              <Link href={`/categories/${categorySlug}`} className="hover:text-copper">
                {categoryTitle}
              </Link>
              {" / "}
              <span className="text-foreground">{brandSlug}</span>
            </>
          ) : (
            <span className="text-foreground">{categoryTitle}</span>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper">
              Category {isBrandView ? `· ${brandSlug}` : ""}
            </div>
            <h1 className="font-display text-5xl md:text-6xl mt-1">
              {categoryTitle} {isBrandView ? `(${brandSlug})` : ""}
            </h1>
            <p className="text-muted-foreground mt-2 font-mono text-xs">
              {parts.length} part{parts.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Brand Filter Pills - Always stay visible whether selected or not */}
        {availableBrands.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mr-2">
              Filter by Brand:
            </span>
            <Link
              href={`/categories/${categorySlug}`}
              className={`hairline px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                !brandSlug ? "bg-ink text-bone" : "bg-card hover:bg-secondary text-foreground"
              }`}
            >
              All Brands
            </Link>
            {availableBrands.map(([bSlug, bName]) => (
              <Link
                key={bSlug}
                href={`/categories/${categorySlug}/${encodeURIComponent(bSlug)}`}
                className={`hairline px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
                  brandSlug?.toLowerCase() === bSlug.toLowerCase()
                    ? "bg-ink text-bone"
                    : "bg-card hover:bg-secondary text-foreground"
                }`}
              >
                {bName}
              </Link>
            ))}
          </div>
        )}

        {/* Parts Grid */}
        <div className="pb-20">
          {loading ? (
            <div className="text-center font-mono text-xs uppercase text-muted-foreground py-20">
              Loading parts…
            </div>
          ) : parts.length ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedParts.map((p) => {
                  const bSlug = p.brandSlug || p.brandName || "Kingtex";
                  const customHref = `/categories/${categorySlug}/${encodeURIComponent(bSlug)}/${encodeURIComponent(p.sku)}`;

                  return (
                    <div key={p.sku} className="contents">
                      <CustomPartCard part={p} customHref={customHref} />
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button px-3 py-1 bg-secondary/30 rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {(() => {
                    const pages = [];
                    const total = totalPages;
                    const cur = currentPage;
                    const range = (start, end) => {
                      for (let i = start; i <= end; i++) pages.push(i);
                    };
                    if (total <= 7) {
                      range(1, total);
                    } else {
                      range(1, 2);
                      if (cur > 4) pages.push("...");
                      const start = Math.max(3, cur - 1);
                      const end = Math.min(total - 2, cur + 1);
                      range(start, end);
                      if (cur < total - 3) pages.push("...");
                      range(total - 1, total);
                    }
                    return pages.map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          disabled={p === cur}
                          className={`pagination-button px-2 py-1 rounded ${p === cur ? "active" : ""}`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button px-3 py-1 bg-secondary/30 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="hairline bg-card p-12 text-center">
              <p className="text-muted-foreground font-mono text-sm">
                No parts found under {categoryTitle} {isBrandView ? `for ${brandSlug}` : ""}.
              </p>
              <Link
                href="/categories"
                className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-copper hover:underline"
              >
                &larr; Back to all categories
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function CustomPartCard({ part, customHref }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const wishlisted = isInWishlist(part.sku);

  return (
    <Link
      href={customHref}
      className="group relative flex flex-col hairline bg-card hover:border-ink transition-colors"
    >
      <div className="relative overflow-hidden bg-secondary aspect-square">
        <img
          src={
            part.images?.[0] ||
            "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
          }
          alt={part.name}
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 bg-white"
          loading="lazy"
        />
        <button
          aria-label="Add to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(part.sku);
          }}
          className={`absolute bottom-3 right-3 h-9 w-9 grid place-items-center transition-colors border border-border ${
            wishlisted
              ? "bg-copper text-copper-foreground"
              : "bg-bone text-ink hover:bg-copper hover:text-copper-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            {part.brandName || "Kingtex"} · {part.modelName || ""}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{part.MCG || part.sku}</span>
        </div>
        <h3 className="font-display text-xl tracking-wide leading-none text-foreground">{part.name}</h3>
        {part.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{part.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="font-display text-2xl">{formatINR(part.price || 550)}</div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(part.sku, 1);
            }}
            className="h-9 px-3 inline-flex items-center gap-1.5 bg-ink text-bone hover:bg-copper transition-colors font-mono text-[11px] tracking-[0.15em] uppercase cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </Link>
  );
}
