"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/src/components/admin-shell";
import { formatINR } from "@/src/lib/format";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/utils/api";

export default function AdminProducts() {
  const [parts, setParts] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadParts = async ({ q, brand, category, nameOnly } = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (brand) params.set("brand", brand);
      if (category) params.set("category", category);
      if (nameOnly) params.set("nameOnly", "true");

      const response = await api(`/api/parts?${params.toString()}`);
      const data = response.data;
      setParts(data);
      if (!q && !brand && !category) {
        setAllParts(data);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    if (!allParts.length) return;
    const brandMap = new Map();
    const categoryMap = new Map();

    allParts.forEach((part) => {
      if (part.brandSlug && part.brandName) {
        brandMap.set(part.brandSlug, part.brandName);
      }
      if (part.modelSlug && part.modelName) {
        categoryMap.set(part.modelSlug, part.modelName);
      }
    });

    const brandOptions = Array.from(brandMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const categoryOptions = Array.from(categoryMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setBrands(brandOptions);
    setCategories(categoryOptions);
  }, [allParts]);

  const handleFilterChange = async () => {
    await loadParts({ q: searchTerm, brand: brandFilter, category: categoryFilter, nameOnly: Boolean(searchTerm) });
  };

  const handleResetFilters = async () => {
    setSearchTerm("");
    setBrandFilter("");
    setCategoryFilter("");
    await loadParts();
  };

  const handleDelete = async (sku) => {
    if (!confirm(`Are you sure you want to delete this product (${sku})?`)) {
      return;
    }

    try {
      await api(`/api/parts/${encodeURIComponent(sku)}`, {
        method: "DELETE",
      });

      setParts((prev) => prev.filter((p) => p.sku !== sku));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Unable to delete product.");
    }
  };

  return (
    <AdminShell title="Products" subtitle="Manage the parts catalog">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            placeholder="Search by name, SKU, brand, category"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleFilterChange();
              }
            }}
            className="h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
          />
          <select
            value={brandFilter}
            onChange={(event) => setBrandFilter(event.target.value)}
            className="h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFilterChange}
              className="h-10 px-4 bg-ink text-bone font-mono text-[11px] uppercase tracking-widest hover:bg-copper transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-10 px-4 bg-secondary/70 text-muted-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          {parts.length} result{parts.length === 1 ? "" : "s"}
          {allParts.length && parts.length !== allParts.length ? (
            <> of {allParts.length} total</>
          ) : ""}
        </div>
        <Link
          href="/admin/products/new"
          className="h-10 px-5 bg-ink text-bone hover:bg-copper font-mono text-[11px] uppercase tracking-widest inline-flex items-center gap-2 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add product
        </Link>
      </div>

      {loading ? (
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading products...
        </div>
      ) : (
        <div className="hairline bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.sku} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <img
                      src={p.images?.[0] || ""}
                      alt=""
                      className="h-10 w-10 object-cover hairline shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-display text-lg truncate">{p.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.id1}</div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>{p.brandName}</td>
                  <td className="font-mono">{formatINR(p.price)}</td>
                  <td>
                    <span className={`font-mono text-xs ${p.stock < 25 ? "text-destructive" : ""}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{p.rating} ★</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    <Link
                      href={`/admin/products/${p.sku}`}
                      className="h-8 w-8 inline-flex items-center justify-center hover:bg-copper/20 text-copper transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.sku)}
                      className="h-8 w-8 inline-flex items-center justify-center hover:bg-destructive/20 text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
