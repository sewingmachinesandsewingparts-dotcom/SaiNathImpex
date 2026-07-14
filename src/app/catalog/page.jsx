"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageShell } from "@/src/components/site-shell";
import { PartCard } from "@/src/components/part-card";
import { SlidersHorizontal } from "lucide-react";
import axios from 'axios';

export default function Catalog() {
  const [parts, setParts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStitchTypes, setSelectedStitchTypes] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState("Sort: Featured");
  const [loading, setLoading] = useState(true);

  // Load brands lists
  useEffect(() => {
    axios("/api/brands")
      .then((res) => res.data)
      .then((data) => setBrands(data))
      .catch((err) => console.error("Error loading catalog brands:", err));
  }, []);

  // Query parts based on filters
  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();

    if (selectedBrands.length > 0) {
      queryParams.set("brand", selectedBrands.join(","));
    }
    if (selectedCategories.length > 0) {
      queryParams.set("category", selectedCategories.join(","));
    }
    if (selectedStitchTypes.length > 0) {
      queryParams.set("stitchType", selectedStitchTypes.join(","));
    }
    if (minPrice) {
      queryParams.set("minPrice", minPrice);
    }
    if (maxPrice) {
      queryParams.set("maxPrice", maxPrice);
    }
    if (inStockOnly) {
      queryParams.set("inStockOnly", "true");
    }
    if (onSale) {
      queryParams.set("onSale", "true");
    }

    // Map sort string to parameter
    let sortVal = "featured";
    if (sort === "Price: low to high") sortVal = "price_asc";
    if (sort === "Price: high to low") sortVal = "price_desc";
    if (sort === "Newest") sortVal = "newest";
    if (sort === "Best rated") sortVal = "rating";
    queryParams.set("sort", sortVal);

    axios(`/api/parts?${queryParams.toString()}`)
      .then((res) => res.data)
      .then((data) => {
        setParts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading parts:", err);
        setLoading(false);
      });
  }, [
    selectedBrands,
    selectedCategories,
    selectedStitchTypes,
    minPrice,
    maxPrice,
    inStockOnly,
    onSale,
    sort,
  ]);

  const handleBrandChange = (slug) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleCategoryChange = (slug) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleStitchTypeChange = (type) => {
    setSelectedStitchTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const isBrand = brands.filter((b) => b.isBrand);
  const othersBrand = brands.find((b) => b.slug === "others");
  const categoriesList = othersBrand ? othersBrand.models : [];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-4">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / All parts
        </nav>
        <h1 className="font-display text-6xl">All parts</h1>
        <p className="text-muted-foreground mt-2">
          {parts.length} items · across {isBrand.length} brands & categories
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 grid grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="col-span-12 md:col-span-3 space-y-6">
          <div className="hairline bg-card p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-copper mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </div>
            <div className="space-y-5 text-sm">
              <Section title="Brand">
                {isBrand.map((b) => (
                  <label key={b.slug} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-copper"
                      checked={selectedBrands.includes(b.slug)}
                      onChange={() => handleBrandChange(b.slug)}
                    />{" "}
                    {b.name}
                  </label>
                ))}
              </Section>

              <Section title="Category">
                {categoriesList.map((m) => (
                  <label key={m.slug} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-copper"
                      checked={selectedCategories.includes(m.slug)}
                      onChange={() => handleCategoryChange(m.slug)}
                    />{" "}
                    {m.name}
                  </label>
                ))}
              </Section>

              <Section title="Stitch type">
                {["Lockstitch", "Overlock", "Chainstitch", "Coverstitch"].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-copper"
                      checked={selectedStitchTypes.includes(s)}
                      onChange={() => handleStitchTypeChange(s)}
                    />{" "}
                    {s}
                  </label>
                ))}
              </Section>

              <Section title="Price (₹)">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="hairline bg-background w-full px-2 py-1.5 text-sm outline-none focus:border-copper"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    className="hairline bg-background w-full px-2 py-1.5 text-sm outline-none focus:border-copper"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Stock">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-copper"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly(!inStockOnly)}
                  />{" "}
                  In stock only
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-copper"
                    checked={onSale}
                    onChange={() => setOnSale(!onSale)}
                  />{" "}
                  On sale
                </label>
              </Section>
            </div>
          </div>
        </aside>

        {/* Grid with irregular layout */}
        <div className="col-span-12 md:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading parts..." : `Showing 1–${parts.length} of ${parts.length}`}
            </div>
            <select
              className="hairline bg-card px-3 py-2 text-sm outline-none"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-64 items-center justify-center text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-card hairline">
              Connecting to parts catalog...
            </div>
          ) : parts.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 h-64 items-center justify-center text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-card hairline">
              No parts match your filters
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
              {parts.map((p, i) => (
                <PartCard key={p.sku} part={p} span={i === 0 || i === 7 ? 2 : 1} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-12 flex items-center justify-center gap-1 font-mono text-[11px] tracking-[0.15em] uppercase">
            <button className="h-9 px-3 hairline hover:bg-ink hover:text-bone">Prev</button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`h-9 w-9 hairline ${n === 1 ? "bg-ink text-bone" : "hover:bg-secondary"}`}
              >
                {n}
              </button>
            ))}
            <button className="h-9 px-3 hairline hover:bg-ink hover:text-bone">Next</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
