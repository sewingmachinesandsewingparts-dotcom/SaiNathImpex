"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import { formatINR } from "@/src/lib/format";
import api from "@/src/utils/api";
import { useCart } from "@/src/lib/cart-context";
import { toast, Toaster } from "sonner";
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

function getGroupedCompatibility(part) {
  if (!part) return [];

  // 1. Prefer structured compatibleBrands if available
  if (Array.isArray(part.compatibleBrands) && part.compatibleBrands.length > 0) {
    const list = [];
    for (const cb of part.compatibleBrands) {
      const brand = (cb.brand || "").trim();
      const models = (cb.machines || [])
        .map((m) => {
          if (typeof m === "string") return m.trim();
          if (m && typeof m.model === "string") return m.model.trim();
          return "";
        })
        .filter(Boolean);

      if (models.length > 0) {
        list.push({ brand: brand || "Compatible", models });
      }
    }
    if (list.length > 0) return list;
  }

  // 2. Fallback: Group flat machineModels array by brand
  if (Array.isArray(part.compat?.machineModels) && part.compat.machineModels.length > 0) {
    const map = new Map();
    for (const rawItem of part.compat.machineModels) {
      if (!rawItem) continue;
      const item = rawItem.trim();

      let brand = "";
      let model = item;

      if (item.includes(" ")) {
        const spaceIdx = item.indexOf(" ");
        brand = item.slice(0, spaceIdx).trim();
        model = item.slice(spaceIdx + 1).trim();
      } else if (item.includes("-")) {
        const hyphenIdx = item.indexOf("-");
        const prefix = item.slice(0, hyphenIdx).trim();
        if (prefix && prefix.length >= 2 && !/^\d+$/.test(prefix)) {
          brand = prefix;
          model = item;
        }
      }

      if (!brand) brand = "Compatible";

      const set = map.get(brand) || new Set();
      set.add(model);
      map.set(brand, set);
    }

    return Array.from(map.entries()).map(([brand, set]) => ({
      brand,
      models: Array.from(set),
    }));
  }

  return [];
}

export default function PartPage({ params }) {
  const resolvedParams = use(params);
  const sku = normalizeSku(resolvedParams.sku);

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [part, setPart] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("specs");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [pendingDeleteReview, setPendingDeleteReview] = useState(null);
  const [userName, setUserName] = useState("Guest");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedReviewIndexes, setExpandedReviewIndexes] = useState([]);

  const reviews = part?.reviewEntries?.slice().reverse() || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const toggleReviewExpanded = (index) => {
    setExpandedReviewIndexes((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index]
    );
  };

  const canModifyReview = (review) => {
    if (!review || !userName) return false;
    if (review.userId && userId) {
      return review.userId === userId;
    }
    return !review.userId && userName !== "Guest" && review.name === userName;
  };

  const startEditingReview = (review) => {
    setEditingReviewId(review._id);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setReviewMessage("Editing review");
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewComment("");
    setReviewMessage("");
  };

  const confirmDeleteReview = (review) => {
    setPendingDeleteReview(review);
  };

  const cancelDeleteReview = () => {
    setPendingDeleteReview(null);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || !part) return;

    setReviewSubmitting(true);
    setReviewMessage("");

    try {
      const { data: updated } = await api(`/api/parts/${encodeURIComponent(part.sku)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ action: "delete", reviewId, name: userName }),
      });
      setPart(updated);
      if (editingReviewId === reviewId) cancelEditingReview();
      toast.success("Review deleted successfully.");
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || error?.message || "Review not deleted.";
      toast.error(errorMessage);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const executeDeleteReview = async () => {
    if (!pendingDeleteReview) return;
    const reviewId = pendingDeleteReview._id;
    setPendingDeleteReview(null);
    await handleDeleteReview(reviewId);
  };

  useEffect(() => {
    let canceled = false;
    const loadPart = async () => {
      try {
        const [{ data }, authResponse] = await Promise.all([
          api(`/api/parts/${encodeURIComponent(sku)}`),
          api.get("/api/auth").catch(() => ({ data: { user: null } })),
        ]);

        if (canceled) return;
        setPart(data);
        setActiveImg(0);
        setQty(1);
        setUserId(authResponse.data?.user?.id || null);
        setUserName(authResponse.data?.user?.name || "Guest");

        const relatedResponse = await api(`/api/parts?brand=${data.brandSlug}`);
        if (canceled) return;
        setRelated(relatedResponse.data.filter((p) => p.sku !== sku).slice(0, 4));
      } catch (err) {
        console.error("Error loading part details:", err);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    loadPart();
    return () => {
      canceled = true;
    };
  }, [sku]);

  // Adjust related list when part finishes loading
  useEffect(() => {
    if (part) {
      api(`/api/parts?brand=${part.brandSlug}`)
        .then((res) => res.data)
        .then((data) => {
          setRelated(data.filter((p) => p.sku !== sku).slice(0, 4));
        })
        .catch((err) => console.error("Error updating related parts:", err));
    }
  }, [part, sku]);

  if (loading && !part) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading part details...
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
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-6">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          /
          <Link href={`/brand/${part.brandSlug}`} className="hover:text-copper">
            {" "}
            {part.brandName}
          </Link>{" "}
          /
          <Link href={`/brand/${part.brandSlug}/${part.modelSlug}`} className="hover:text-copper">
            {" "}
            {part.modelName}
          </Link>{" "}
          / {part.id1}
        </nav>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="w-full hairline bg-card overflow-hidden relative flex items-center justify-center" style={{ maxHeight: 420 }}>
              <img
                src={
                  part.images?.[activeImg] ||
                  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"
                }
                alt={part.name}
                style={{ width: 243 }}
                className="max-h-full max-w-full object-contain object-center"
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
                    className={`aspect-square hairline overflow-hidden bg-white flex items-center justify-center ${
                      activeImg === i ? "border-ink" : ""
                    }`}
                  >
                    <img src={src} alt="" className="max-h-full max-w-full object-contain object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy box */}
          <div className="lg:col-span-5">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-2">
              {part.brandName} · {part.modelName}
            </div>
            <h1 className="font-display text-5xl leading-none">{part.name}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(part.rating || 0) ? "fill-copper text-copper" : "text-border"}`}
                  />
                ))}
              </div>
              <span>
                {part.rating} · {part.reviews} reviews
              </span>
              <span>·</span>
              <span className="font-mono text-xs">SKU {part.sku}</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="font-display text-5xl">{formatINR(part.price)}</span>
              {onSale && (
                <span className="font-mono text-sm line-through text-muted-foreground mb-2">
                  {formatINR(part.compareAt)}
                </span>
              )}
              <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.15em] text-success flex items-center gap-1 mb-2">
                <Check className="h-3.5 w-3.5" /> {part.stock} in stock
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {part.hasMotor ? "Incl. 18% GST" : "Incl. 5% GST"} · Shipping extra at checkout
            </p>

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
                { Icon: Truck, h: "48h dispatch", s: "From Ludhiana" },
                { Icon: ShieldCheck, h: "OEM-grade", s: "1-yr warranty" },
                { Icon: RotateCcw, h: "30-day returns", s: "Free pickup" },
              ].map(({ Icon, h, s }) => (
                <div key={h} className="p-3 text-center">
                  <Icon className="h-4 w-4 text-copper mx-auto mb-1.5" />
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em]">{h}</div>
                  <div className="text-[11px] text-muted-foreground">{s}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-muted-foreground leading-relaxed">
              {part.description}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="hairline p-3">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  Part #1
                </span>
                <div>{part.id1}</div>
              </div>
              {part.id2 && (
                <div className="hairline p-3">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                    Part #2
                  </span>
                  <div>{part.id2}</div>
                </div>
              )}
              <div className="hairline p-3">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  Diagram
                </span>
                <div>{part.diagramNumber}</div>
              </div>
              {part.altPartNumbers?.length > 0 && (
                <div className="hairline p-3 col-span-2">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                    Alt part #s
                  </span>
                  <div>{part.altPartNumbers.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20">
          <div className="flex gap-1 border-b border-border">
            {[
              { id: "specs", l: "Specifications" },
              { id: "compat", l: "Compatibility" },
              { id: "series", l: "Series" },
              { id: "maint", l: "Maintenance" },
              { id: "reviews", l: `Reviews · ${part.reviews || 0}` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 font-mono text-[11px] tracking-[0.2em] uppercase border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? "border-copper text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="py-8 max-w-3xl text-sm">
            {tab === "specs" && part.specs && (
              <dl className="grid grid-cols-2 gap-y-3 gap-x-8">
                {Object.entries(part.specs).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {k}
                    </dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {tab === "compat" && part.compat && (
              <div className="space-y-4">
                {(() => {
                  const groupedCompat = getGroupedCompatibility(part);
                  if (groupedCompat.length === 0) return null;
                  return (
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
                        Compatible machines
                      </div>
                      <div className="space-y-3">
                        {groupedCompat.map((group, idx) => (
                          <div key={group.brand || idx} className="flex flex-wrap items-center gap-2">
                            {group.brand && group.brand !== "Compatible" && (
                              <span className="font-mono text-xs font-semibold text-copper uppercase tracking-wider min-w-[70px]">
                                {group.brand}:
                              </span>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {group.models.map((m) => (
                                <span key={m} className="hairline px-3 py-1.5 text-xs bg-background">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {part.compat.stitchType && (
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                      Stitch type
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {part.compat.stitchType.map((s) => (
                        <span key={s} className="hairline px-3 py-1.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {part.compat.needleSystem && (
                  <p>
                    Needle system: <strong>{part.compat.needleSystem}</strong>
                  </p>
                )}
                {part.compat.threadType && (
                  <p>
                    Thread: <strong>{part.compat.threadType}</strong>
                  </p>
                )}
              </div>
            )}

            {tab === "series" && (
              <div className="space-y-4">
                {(() => {
                  const DUMMY_SKUS = new Set(["1", "2", "3", "4", "5", "6"]);

                  if (part.series && part.series.length > 0) {
                    return part.series.map((s) => {
                      const validProds = (s.products || []).filter(
                        (p) => p && !DUMMY_SKUS.has((p.sku || p.code || p.name || "").toString().trim())
                      );
                      return (
                        <div key={s.code || s.id} className="hairline p-4 rounded-3xl">
                          <div className="font-mono text-sm uppercase tracking-widest">
                            {s.code} {s.name ? `· ${s.name}` : null}
                          </div>
                          {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
                          {validProds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {validProds.map((p) => (
                                <Link
                                  key={p.sku || p.code}
                                  href={`/part/${encodeURIComponent(p.sku || p.code)}`}
                                  className="hairline px-3 py-1.5 text-xs"
                                >
                                  {p.code || p.sku || p.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  }

                  if (part.linkedSeries && part.linkedSeries.series) {
                    const validSkus = (part.linkedSeries.products || []).filter(
                      (sku) => sku && !DUMMY_SKUS.has(sku.toString().trim())
                    );
                    if (validSkus.length === 0) {
                      return (
                        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                          No series linked for this part.
                        </div>
                      );
                    }
                    return (
                      <div className="hairline p-4 rounded-3xl">
                        <div className="font-mono text-sm uppercase tracking-widest">
                          Series {part.linkedSeries.series}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {validSkus.map((sku) => (
                            <Link
                              key={sku}
                              href={`/part/${encodeURIComponent(sku)}`}
                              className="hairline px-3 py-1.5 text-xs"
                            >
                              {sku}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                      No series linked for this part.
                    </div>
                  );
                })()}
              </div>
            )}

            {tab === "maint" && part.maintenance && (
              <ul className="space-y-3">
                {part.maintenance.lubrication && (
                  <li>
                    <strong>Lubrication:</strong> {part.maintenance.lubrication}
                  </li>
                )}
                {part.maintenance.replacementInterval_hours && (
                  <li>
                    <strong>Replacement interval:</strong> every{" "}
                    {part.maintenance.replacementInterval_hours.toLocaleString()} hours of operation
                  </li>
                )}
              </ul>
            )}
            {tab === "reviews" && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      visibleReviews.map((review, index) => {
                        const isExpanded = expandedReviewIndexes.includes(index);
                        return (
                          <div key={`${review._id || review.name}-${index}`} className="hairline p-4 rounded-3xl">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-mono text-xs">{review.name}</div>
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              {canModifyReview(review) && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditingReview(review)}
                                    className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-copper hover:bg-copper/10"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmDeleteReview(review)}
                                    className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-destructive hover:bg-destructive/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-copper text-copper" : "text-border"}`}
                                />
                              ))}
                            </div>
                            <p
                              className={`mt-2 text-sm overflow-hidden text-ellipsis ${
                                isExpanded ? "max-h-full" : "max-h-18 line-clamp-3"
                              }`}
                            >
                              {review.comment}
                            </p>
                            {review.comment.length > 180 && (
                              <button
                                type="button"
                                onClick={() => toggleReviewExpanded(index)}
                                className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-copper"
                              >
                                {isExpanded ? "Show less" : "More details"}
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                        No reviews yet. Be the first to rate and review this part.
                      </div>
                    )}
                    {reviews.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-sm font-mono uppercase tracking-[0.2em] text-copper"
                      >
                        {showAllReviews ? "See less reviews" : `See all ${reviews.length} reviews`}
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setReviewSubmitting(true);
                      setReviewMessage("");

                      try {
                        const payload = {
                          reviewId: editingReviewId,
                          name: userName || "Guest",
                          rating: reviewRating,
                          comment: reviewComment,
                        };

                        const { data: updated } = await api(`/api/parts/${encodeURIComponent(part.sku)}`, {
                          method: editingReviewId ? "PATCH" : "POST",
                          headers: { "Content-Type": "application/json" },
                          data: JSON.stringify(payload),
                        });

                        setPart(updated);
                        setReviewRating(5);
                        setReviewComment("");
                        if (editingReviewId) {
                          toast.success("Review updated successfully.");
                          cancelEditingReview();
                        } else {
                          toast.success("Review submitted successfully.");
                        }
                      } catch (error) {
                        console.error(error);
                        const errorMessage = error?.response?.data?.message || error?.message || "Review not saved.";
                        toast.error(errorMessage);
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                    className="rounded-3xl border border-border bg-card p-5 space-y-4"
                  >
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                        Leave a review
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setReviewRating(value)}
                            className="rounded-full p-2 transition-colors hover:bg-secondary"
                            aria-label={`${value} star`}
                          >
                            <Star
                              className={`h-4 w-4 ${value <= reviewRating ? "fill-copper text-copper" : "text-border"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Comment
                      </span>
                      <textarea
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        rows={5}
                        placeholder="Tell others what you liked"
                        className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-copper resize-none max-h-40 overflow-y-auto"
                      />
                    </label>

                    <div className="flex flex-col gap-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink px-4 text-sm text-bone transition hover:bg-copper disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reviewSubmitting ? "Saving..." : editingReviewId ? "Update review" : "Submit review"}
                      </button>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={cancelEditingReview}
                          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border bg-background px-4 text-sm text-foreground transition hover:bg-secondary"
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-4xl mb-6">More from {part.brandName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <PartCard key={p.sku} part={p} />
              ))}
            </div>
          </section>
        )}

        {pendingDeleteReview && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-border bg-background p-4 shadow-2xl ring-1 ring-black/5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Delete review?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This will remove the review permanently.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={cancelDeleteReview}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-sm text-foreground transition hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeDeleteReview}
                    disabled={reviewSubmitting}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-destructive px-4 text-sm text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Deleting..." : "Delete review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" richColors />
    </PageShell>
  );
}
