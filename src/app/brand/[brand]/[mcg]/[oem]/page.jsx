"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/src/components/site-shell";
import api from "@/src/utils/api";

export default function OemPartPage({ params }) {
  const resolvedParams = use(params);
  const brandSlug = resolvedParams.brand;
  const mcgCode   = resolvedParams.mcg;
  const oemNumber = resolvedParams.oem;

  const [part, setPart]     = useState(null);
  const [brand, setBrand]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api("/api/brands").then((res) => res.data),
      api(`/api/parts?brand=${brandSlug}&mcg=${encodeURIComponent(mcgCode)}&oem=${encodeURIComponent(oemNumber)}`).then((res) => res.data),
    ])
      .then(([brands, partsData]) => {
        const foundBrand = brands.find((x) => x.slug === brandSlug);
        if (foundBrand) setBrand(foundBrand);

        const found = (partsData || []).find(
          (p) => p.OEM === oemNumber || p.id2 === oemNumber
        );
        if (found) {
          setPart(found);
        } else {
          setError("Part not found.");
        }
      })
      .catch((err) => {
        console.error("Error loading OEM part:", err);
        setError("Failed to load part.");
      })
      .finally(() => setLoading(false));
  }, [brandSlug, mcgCode, oemNumber]);

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading part…
        </div>
      </PageShell>
    );
  }

  if (error || !part) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {error || "Part not found."}
        </div>
      </PageShell>
    );
  }

  const inStock = part.stock > 0;

  return (
    <PageShell>
      {/* ─── Header band ─── */}
      <div className="bg-ink text-bone">
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Breadcrumb: Home / Brand / MCG / OEM */}
          <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-bone/50 mb-4 flex flex-wrap gap-1 items-center">
            <Link href="/" className="hover:text-copper">Home</Link>
            <span>/</span>
            <Link href={`/brand/${brandSlug}`} className="hover:text-copper">
              {brand?.name ?? brandSlug.toUpperCase()}
            </Link>
            <span>/</span>
            <Link href={`/brand/${brandSlug}/${mcgCode}`} className="hover:text-copper">
              {mcgCode}
            </Link>
            <span>/</span>
            <span className="text-copper">{oemNumber}</span>
          </nav>

          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
            {brand?.name ?? brandSlug.toUpperCase()} · MCG {mcgCode} · OEM {oemNumber}
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-tight">{part.name}</h1>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-10">

          {/* Left: Image */}
          <div>
            {part.images?.length > 0 ? (
              <img
                src={part.images[0]}
                alt={part.name}
                className="w-full hairline object-contain bg-card p-4"
                style={{ maxHeight: 420 }}
              />
            ) : (
              <div className="w-full hairline bg-card flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest" style={{ height: 280 }}>
                No image
              </div>
            )}
            {/* Additional images */}
            {part.images?.length > 1 && (
              <div className="flex gap-2 mt-3">
                {part.images.slice(1).map((img, i) => (
                  <img key={i} src={img} alt={`${part.name} ${i + 2}`} className="w-20 h-20 object-contain hairline bg-card p-1" />
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Identifiers */}
            <div className="hairline bg-card p-4 grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <div className="text-muted-foreground uppercase tracking-widest text-[10px]">SKU</div>
                <div className="font-semibold mt-1">{part.sku}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-widest text-[10px]">OEM #</div>
                <div className="font-semibold mt-1">{part.OEM || part.id2 || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-widest text-[10px]">MCG</div>
                <div className="font-semibold mt-1">{part.MCG || part.id1 || "—"}</div>
              </div>
              {part.diagramNumber && (
                <div>
                  <div className="text-muted-foreground uppercase tracking-widest text-[10px]">Diagram #</div>
                  <div className="font-semibold mt-1">{part.diagramNumber}</div>
                </div>
              )}
            </div>

            {/* Price & Stock */}
            <div className="flex items-end gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Price</div>
                <div className="font-display text-4xl mt-1">
                  ₹{part.price?.toLocaleString("en-IN")}
                </div>
                {part.compareAt && part.compareAt > part.price && (
                  <div className="font-mono text-sm line-through text-muted-foreground mt-1">
                    ₹{part.compareAt.toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div className={`font-mono text-xs uppercase tracking-widest px-3 py-1 hairline ${inStock ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-rose-500 border-rose-300 bg-rose-50"}`}>
                {inStock ? `In stock · ${part.stock} units` : "Out of stock"}
              </div>
            </div>

            {/* Description */}
            {part.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{part.description}</p>
            )}

            {/* Alt part numbers */}
            {part.altPartNumbers?.length > 0 && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Alt Part Numbers</div>
                <div className="flex flex-wrap gap-2">
                  {part.altPartNumbers.map((n) => (
                    <span key={n} className="font-mono text-xs hairline px-2 py-1 bg-card">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/part/${part.sku}`}
              className="inline-block hairline bg-ink text-bone font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-copper transition-colors"
            >
              View full product page →
            </Link>
          </div>
        </div>

        {/* ─── Specs ─── */}
        {(part.specs?.material || part.specs?.weight || part.specs?.dimensions || part.compat?.machineModels?.length > 0) && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {(part.specs?.material || part.specs?.weight || part.specs?.dimensions) && (
              <div className="hairline bg-card p-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-copper mb-4">Specifications</div>
                <dl className="space-y-3 font-mono text-sm">
                  {part.specs.material && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Material</dt>
                      <dd className="text-right">{part.specs.material}</dd>
                    </div>
                  )}
                  {part.specs.weight && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Weight</dt>
                      <dd>{part.specs.weight}</dd>
                    </div>
                  )}
                  {part.specs.dimensions && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Dimensions</dt>
                      <dd>{part.specs.dimensions}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {part.compat?.machineModels?.length > 0 && (
              <div className="hairline bg-card p-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-copper mb-4">Compatible Models</div>
                <div className="flex flex-wrap gap-2">
                  {part.compat.machineModels.map((m) => (
                    <span key={m} className="font-mono text-xs hairline px-2 py-1 bg-background">{m}</span>
                  ))}
                </div>
                {part.compat.stitchType?.length > 0 && (
                  <div className="mt-3 font-mono text-xs text-muted-foreground">
                    Stitch: {part.compat.stitchType.join(", ")}
                  </div>
                )}
                {part.compat.needleSystem && (
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    Needle: {part.compat.needleSystem}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Back link ─── */}
        <div className="mt-10 font-mono text-xs">
          <Link href={`/brand/${brandSlug}/${mcgCode}`} className="hover:text-copper underline underline-offset-2">
            ← Back to {brand?.name ?? brandSlug.toUpperCase()} / {mcgCode}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
