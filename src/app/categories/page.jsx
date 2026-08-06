"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/src/components/site-shell";
import api from "@/src/utils/api";

function canonicalCategory(str) {
  const text = String(str || "").trim();
  const lower = text.toLowerCase();

  if (lower.includes("needle plate")) return { name: "Needle Plate", slug: "NeedlePlate" };
  if (lower.includes("looper")) return { name: "Looper", slug: "Looper" };
  if (lower.includes("feed dog")) return { name: "Feed Dog", slug: "FeedDog" };
  if (lower.includes("presser foot") || lower.includes("presser feet")) return { name: "Presser Foot", slug: "PresserFoot" };
  if (lower.includes("tension")) return { name: "Tension Assembly", slug: "TensionAssembly" };
  if (lower.includes("thread stand")) return { name: "Thread Stand", slug: "ThreadStand" };

  let normalized = text;
  if (/s$/i.test(normalized) && !/ss$/i.test(normalized)) {
    normalized = normalized.slice(0, -1);
  }

  const words = normalized
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const cleanName = words.join(" ");
  const cleanSlug = words.join("");
  return { name: cleanName || "General Parts", slug: cleanSlug || "GeneralParts" };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const partsRes = await api("/api/parts");
        const parts = partsRes.data || [];

        const map = {};

        for (const p of parts) {
          const rootName = (p.categoryRoot || p.modelName || p.taxonomy?.category || "").trim();
          if (!rootName) continue;

          const { name: categoryName, slug } = canonicalCategory(rootName);

          if (!map[slug]) {
            map[slug] = {
              slug,
              categoryName,
              images: [],
            };
          }

          if (Array.isArray(p.images) && p.images.length > 0) {
            for (const img of p.images) {
              if (img) map[slug].images.push(img);
            }
          }
        }

        // Fallback if no parts returned
        if (Object.keys(map).length === 0) {
          map["NeedlePlate"] = {
            slug: "NeedlePlate",
            categoryName: "Needle Plate",
            images: ["https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70"],
          };
        }

        const resultList = Object.values(map).map((cat) => {
          const randomImage = cat.images.length > 0
            ? cat.images[Math.floor(Math.random() * cat.images.length)]
            : "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=70";

          return {
            ...cat,
            randomImage,
          };
        });

        setCategories(resultList);
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Categories
        </nav>

        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-copper mb-2">
              Browse Categories
            </div>
            <h1 className="font-display text-5xl md:text-6xl">Categories</h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground py-20">
            Loading categories…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-14">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="hairline bg-card hover:bg-ink hover:text-bone transition-colors p-5 flex flex-col gap-2 group"
              >
                <div className="w-full aspect-[4/3] bg-white rounded-md overflow-hidden mb-2 border border-border flex items-center justify-center p-2">
                  <img
                    src={cat.randomImage}
                    alt={cat.categoryName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-display text-2xl tracking-wide">{cat.categoryName}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
