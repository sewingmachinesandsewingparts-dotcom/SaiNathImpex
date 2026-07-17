"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import api from "@/src/utils/api";

const scopeOptions = [
  { value: "all", label: "All products" },
  { value: "brand", label: "Brand" },
  { value: "model", label: "Model" },
  { value: "category", label: "Category" },
  { value: "stitch_type", label: "Stitch type" },
  { value: "price_range", label: "Price range" },
];

const stitchTypes = ["Lockstitch", "Overlock", "Chainstitch", "Coverstitch"];

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleName, setSaleName] = useState("");
  const [scope, setScope] = useState("brand");
  const [scopeRef, setScopeRef] = useState("");
  const [percent, setPercent] = useState(10);
  const [endsAt, setEndsAt] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [editSaleId, setEditSaleId] = useState("");

  useEffect(() => {
    Promise.all([
      api("/api/sales").then((r) => r.data),
      api("/api/brands").then((r) => r.data),
    ])
      .then(([salesData, brandData]) => {
        setSales(salesData);
        setBrands(brandData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const others = brands.find((b) => b.slug === "others");
    return others?.models || [];
  }, [brands]);

  const modelOptions = useMemo(() => {
    const brand = brands.find((b) => b.slug === scopeRef);
    return brand?.models || [];
  }, [brands, scopeRef]);

  const buildScopeRef = () => {
    if (scope === "all") return "all";
    if (scope === "price_range") return `${priceMin || 0}-${priceMax || 0}`;
    return scopeRef || "all";
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: saleName,
      scope,
      scopeRef: buildScopeRef(),
      percent: Number(percent),
      endsAt,
    };

    const method = editSaleId ? "PATCH" : "POST";
    if (editSaleId) payload.id = editSaleId;

    try {
      const res = await api("/api/sales", {
        method,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
      });
      const saved = res.data;
      setSales((prev) => {
        if (editSaleId) {
          return prev.map((sale) => (sale.id === saved.id ? saved : sale));
        }
        return [saved, ...prev];
      });
      setSaleName("");
      setPercent(10);
      setEndsAt("");
      setScopeRef("");
      setPriceMin("");
      setPriceMax("");
      setEditSaleId("");
      toast.success(editSaleId ? "Sale updated successfully." : "Sale created successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Unable to save sale.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSale = (sale) => {
    setEditSaleId(sale.id);
    setSaleName(sale.name);
    setScope(sale.scope);
    setScopeRef(sale.scopeRef);
    setPercent(sale.percent);
    setEndsAt(sale.endsAt.slice(0, 10));
    const [min, max] = sale.scopeRef.split("-");
    setPriceMin(min || "");
    setPriceMax(max || "");
  };

  const handleCancelEdit = () => {
    setEditSaleId("");
    setSaleName("");
    setScope("brand");
    setScopeRef("");
    setPercent(10);
    setEndsAt("");
    setPriceMin("");
    setPriceMax("");
  };

  const handleDeleteSale = async (id) => {
    // TODO: replace confirm with a custom modal if you want a non-blocking confirmation flow.
    if (!confirm("Delete this sale?")) return;
    try {
      await api("/api/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ id }),
      });
      setSales((prev) => prev.filter((sale) => sale.id !== id));
      if (editSaleId === id) handleCancelEdit();
      toast.success("Sale deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Unable to delete sale.");
    }
  };

  return (
    <AdminShell title="Sales" subtitle="Create and manage promotions">
      <div className="space-y-8">
        <form onSubmit={handleCreateSale} className="hairline bg-card p-6 space-y-6">
          {editSaleId && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-copper/20 bg-copper/5 p-4 text-sm text-copper">
              <span>Editing sale {editSaleId}</span>
              <button type="button" onClick={handleCancelEdit} className="font-semibold underline">
                Cancel edit
              </button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Sale name
              </span>
              <input
                placeholder="Summer workshop sale"
                value={saleName}
                onChange={(e) => setSaleName(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Discount percent
              </span>
              <input
                type="number"
                min={1}
                max={90}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Sale type
              </span>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setScopeRef("");
                }}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              >
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Ends at
              </span>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
          </div>

          {scope === "brand" && (
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Brand
              </span>
              <select
                value={scopeRef}
                onChange={(e) => setScopeRef(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {scope === "model" && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Brand
                </span>
                <select
                  value={scopeRef}
                  onChange={(e) => setScopeRef(e.target.value)}
                  className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                  required
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand.slug} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Model slug
                </span>
                <input
                  placeholder="model-slug"
                  value={scopeRef}
                  onChange={(e) => setScopeRef(e.target.value)}
                  className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
            </div>
          )}

          {scope === "category" && (
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Category
              </span>
              <select
                value={scopeRef}
                onChange={(e) => setScopeRef(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {scope === "stitch_type" && (
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Stitch type
              </span>
              <select
                value={scopeRef}
                onChange={(e) => setScopeRef(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Select stitch type</option>
                {stitchTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          )}

          {scope === "price_range" && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Min price
                </span>
                <input
                  type="number"
                  min={0}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Max price
                </span>
                <input
                  type="number"
                  min={0}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                  required
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 px-6 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em]"
          >
            {saving ? "Saving…" : "Create sale"}
          </button>
        </form>

        {loading ? (
          <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading sales...
          </div>
        ) : (
          <div className="hairline bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3">Sale ID</th>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Scope ref</th>
                  <th>Discount</th>
                  <th>Ends</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-6 py-3 font-mono">{s.id}</td>
                    <td>{s.name}</td>
                    <td className="font-mono uppercase tracking-[0.15em] text-muted-foreground">{s.scope.replace("_", " ")}</td>
                    <td className="font-mono text-xs text-muted-foreground">{s.scopeRef}</td>
                    <td className="font-mono">{s.percent}%</td>
                    <td className="text-muted-foreground">{new Date(s.endsAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditSale(s)}
                        className="text-copper underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSale(s.id)}
                        className="text-destructive underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest"
                    >
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
