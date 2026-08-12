"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import { toast } from "sonner";
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

// Live Countdown Timer Component
function SaleCountdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endsAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dStr = days > 0 ? `${days}d ` : "";
      const hStr = String(hours).padStart(2, "0");
      const mStr = String(minutes).padStart(2, "0");
      const sStr = String(seconds).padStart(2, "0");

      setTimeLeft(`${dStr}${hStr}:${mStr}:${sStr}`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <span
      className={`font-mono text-xs px-2 py-1 rounded inline-block font-bold ${
        isExpired
          ? "bg-red-500/10 text-red-600 border border-red-500/20"
          : "bg-copper/10 text-copper border border-copper/30 animate-pulse"
      }`}
    >
      {timeLeft || "Calculating..."}
    </span>
  );
}

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleName, setSaleName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [claimedPercent, setClaimedPercent] = useState(75);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(10);
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
      title: title || saleName,
      subtitle,
      bannerUrl,
      claimedPercent: Number(claimedPercent),
      discountType,
      discountValue: Number(discountValue || percent),
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
      handleCancelEdit();
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
    setSaleName(sale.name || "");
    setTitle(sale.title || sale.name || "");
    setSubtitle(sale.subtitle || "");
    setBannerUrl(sale.bannerUrl || sale.image || "");
    setClaimedPercent(sale.claimedPercent ?? 75);
    setDiscountType(sale.discountType || "percentage");
    setDiscountValue(sale.discountValue || sale.percent || 10);
    setScope(sale.scope);
    setScopeRef(sale.scopeRef);
    setPercent(sale.percent || 10);
    setEndsAt(sale.endsAt ? new Date(sale.endsAt).toISOString().slice(0, 16) : "");
    const [min, max] = (sale.scopeRef || "").split("-");
    setPriceMin(min || "");
    setPriceMax(max || "");
  };

  const handleCancelEdit = () => {
    setEditSaleId("");
    setSaleName("");
    setTitle("");
    setSubtitle("");
    setBannerUrl("");
    setClaimedPercent(75);
    setDiscountType("percentage");
    setDiscountValue(10);
    setScope("brand");
    setScopeRef("");
    setPercent(10);
    setEndsAt("");
    setPriceMin("");
    setPriceMax("");
  };

  const handleDeleteSale = async (id) => {
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
    <AdminShell title="Sales & Promotions" subtitle="Manage flash sales, images, and live timers">
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

          {/* Row 1: Name, Title, Subtitle */}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Internal Name *
              </span>
              <input
                placeholder="Summer Flash Sale"
                value={saleName}
                onChange={(e) => setSaleName(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Display Title
              </span>
              <input
                placeholder="AuraX Pro ANC Headphones"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Subtitle / Badge
              </span>
              <input
                placeholder="₹1,499.00 Special"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>

          {/* Row 2: Image URL, Claimed %, Ends At (Datetime) */}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Image / Banner URL
              </span>
              <input
                type="url"
                placeholder="https://example.com/deal-image.png"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Claimed Progress (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={claimedPercent}
                onChange={(e) => setClaimedPercent(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Timer End Date & Time *
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
          </div>

          {/* Row 3: Discount Type, Discount Value, Scope */}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Discount Type
              </span>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Discount Value *
              </span>
              <input
                type="number"
                min={1}
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  setPercent(e.target.value);
                }}
                className="mt-2 w-full hairline bg-background px-3 py-2 text-sm outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Applicable Scope
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
          </div>

          {/* Scope Ref Dynamic Fields */}
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
                  Model Slug
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
                Stitch Type
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
                  Min Price
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
                  Max Price
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

          {/* Image Preview Box */}
          {bannerUrl && (
            <div className="flex items-center gap-4 p-3 bg-secondary/20 rounded border border-border">
              <img src={bannerUrl} alt="Preview" className="h-16 w-16 object-contain rounded bg-white border border-border" />
              <div className="text-xs text-muted-foreground font-mono">
                Image Preview
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 px-6 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em]"
          >
            {saving ? "Saving…" : editSaleId ? "Update sale" : "Create sale"}
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
                  <th className="px-6 py-3">Image</th>
                  <th>ID / Name</th>
                  <th>Scope</th>
                  <th>Discount</th>
                  <th>Claimed</th>
                  <th>Live Timer</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const img = s.bannerUrl || s.image;
                  return (
                    <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-6 py-3">
                        {img ? (
                          <img src={img} alt={s.name} className="h-12 w-12 object-contain rounded bg-white border border-border" />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center font-mono text-[10px] text-muted-foreground">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-ink">{s.title || s.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{s.id}</div>
                      </td>
                      <td className="font-mono uppercase tracking-[0.15em] text-muted-foreground">
                        {s.scope.replace("_", " ")} ({s.scopeRef})
                      </td>
                      <td className="font-mono font-bold text-copper">
                        {s.discountType === "fixed" ? `₹${s.discountValue}` : `${s.percent || s.discountValue}%`}
                      </td>
                      <td className="font-mono">{s.claimedPercent ?? 75}%</td>
                      <td className="py-3">
                        <SaleCountdown endsAt={s.endsAt} />
                      </td>
                      <td className="px-6 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditSale(s)}
                          className="text-copper underline font-mono text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(s.id)}
                          className="text-red-600 underline font-mono text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
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
