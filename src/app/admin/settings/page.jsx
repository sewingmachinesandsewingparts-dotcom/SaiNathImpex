"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/src/components/admin-shell";
import { toast } from "sonner";
import axios from 'axios';

export default function AdminSettings() {
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState("");
  const [brandError, setBrandError] = useState("");

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await axios("/api/brands");
        const data = response.data;
        setBrands(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setBrandError(error.message || "Unable to load brands.");
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, []);

  const handleDeleteBrand = async (slug) => {
    // TODO: replace confirm with a custom modal if you want non-blocking confirmation.
    if (!confirm(`Are you sure you want to delete the brand '${slug}'?`)) {
      return;
    }

    try {
      setDeletingSlug(slug);
      setBrandError("");
      await axios(`/api/brands?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      setBrands((current) => current.filter((brand) => brand.slug !== slug));
      toast.success("Brand deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Could not delete brand.");
    } finally {
      setDeletingSlug("");
    }
  };

  const handleDeleteModel = async (brandSlug, modelSlug) => {
    // TODO: replace confirm with a custom modal if you want non-blocking confirmation.
    if (!confirm(`Are you sure you want to delete the model '${modelSlug}'?`)) {
      return;
    }

    const deletingKey = `${brandSlug}:${modelSlug}`;
    try {
      setDeletingSlug(deletingKey);
      setBrandError("");
      await axios(
        `/api/brands?slug=${encodeURIComponent(brandSlug)}&modelSlug=${encodeURIComponent(modelSlug)}`,
        {
          method: "DELETE",
        },
      );

      setBrands((current) =>
        current.map((brand) =>
          brand.slug === brandSlug
            ? { ...brand, models: brand.models.filter((model) => model.slug !== modelSlug) }
            : brand,
        ),
      );
      toast.success("Model deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Could not delete model.");
    } finally {
      setDeletingSlug("");
    }
  };

  return (
    <AdminShell title="Settings" subtitle="Configure your store">
      <div className="max-w-2xl space-y-6">
        <div className="hairline bg-card p-6">
          <div className="font-mono text-[11px] uppercase tracking-widest mb-4 pb-4 border-b border-border">
            Store Profile
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-muted-foreground">Store Name</label>
              <input
                type="text"
                defaultValue="Stitch Auto Parts"
                className="w-full h-10 px-3 bg-secondary/50 border-none focus:ring-1 focus:ring-copper"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-muted-foreground">Support Email</label>
              <input
                type="email"
                defaultValue="support@stitchparts.example.com"
                className="w-full h-10 px-3 bg-secondary/50 border-none focus:ring-1 focus:ring-copper"
              />
            </div>
          </div>
        </div>

        <div className="hairline bg-card p-6">
          <div className="font-mono text-[11px] uppercase tracking-widest mb-4 pb-4 border-b border-border">
            Brand Management
          </div>
          {brandError ? (
            <div className="text-sm text-destructive mb-4">{brandError}</div>
          ) : null}
          {loadingBrands ? (
            <div className="text-sm text-muted-foreground">Loading brands…</div>
          ) : brands.length > 0 ? (
            <div className="space-y-3">
              {brands.map((brand) => (
                <div
                  key={brand.slug}
                  className="space-y-4 p-4 bg-secondary/50 rounded-md border border-border"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{brand.name}</div>
                      <div className="text-sm text-muted-foreground">slug: {brand.slug}</div>
                    </div>
                    <button
                      type="button"
                      disabled={deletingSlug === brand.slug}
                      onClick={() => handleDeleteBrand(brand.slug)}
                      className="h-10 px-4 bg-destructive text-bone font-mono text-[11px] uppercase tracking-widest rounded-md disabled:opacity-50"
                    >
                      {deletingSlug === brand.slug ? "Deleting…" : "Delete brand"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Models</div>
                    {brand.models?.length > 0 ? (
                      <div className="space-y-2">
                        {brand.models.map((model) => (
                          <div
                            key={model.slug}
                            className="flex items-center justify-between gap-4 p-3 bg-background rounded-md border border-border"
                          >
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-muted-foreground">slug: {model.slug}</div>
                            </div>
                            <button
                              type="button"
                              disabled={deletingSlug === `${brand.slug}:${model.slug}`}
                              onClick={() => handleDeleteModel(brand.slug, model.slug)}
                              className="h-9 px-3 bg-destructive text-bone font-mono text-[11px] uppercase tracking-widest rounded-md disabled:opacity-50"
                            >
                              {deletingSlug === `${brand.slug}:${model.slug}` ? "Deleting…" : "Delete model"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No models available.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No brands available.</div>
          )}
        </div>

        <div className="hairline bg-card p-6">
          <div className="font-mono text-[11px] uppercase tracking-widest mb-4 pb-4 border-b border-border">
            Payment Methods
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:border-copper transition-colors">
              <input type="checkbox" defaultChecked className="accent-copper" />
              <span className="text-sm">Credit Card (Stripe)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:border-copper transition-colors">
              <input type="checkbox" defaultChecked className="accent-copper" />
              <span className="text-sm">UPI / Netbanking (Razorpay)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="h-10 px-6 bg-ink text-bone font-mono text-[11px] uppercase tracking-widest hover:bg-copper transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
