"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/src/components/site-shell";
import axios from "axios";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios("/api/brands");
        const data = res.data || [];
        const others = data.find((b) => b.slug === "others");
        if (others && Array.isArray(others.models) && others.models.length > 0) {
          setCategories(others.models);
          return;
        }

        // Fallback: derive from parts
        const partsRes = await axios("/api/parts?brand=Others");
        const parts = partsRes.data || [];
        const uniq = {};
        parts.forEach((p) => {
          if (p.modelSlug) uniq[p.modelSlug] = p.modelName || p.modelSlug;
        });
        setCategories(Object.keys(uniq).map((k) => ({ slug: k, name: uniq[k] })));
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };

    load();
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
        <div className="hairline bg-card p-6">
          <h1 className="font-display text-4xl">Categories</h1>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${encodeURIComponent(c.slug)}`}
                className="hairline bg-card hover:bg-ink hover:text-bone transition-colors p-4 flex flex-col gap-1"
              >
                <div className="font-display text-2xl">{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
