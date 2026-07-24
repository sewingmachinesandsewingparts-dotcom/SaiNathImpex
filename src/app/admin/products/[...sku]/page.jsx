"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Save, X } from "lucide-react";
import { AdminShell } from "@/src/components/admin-shell";
import api from "@/src/utils/api";
import { buildProductName, buildSku } from "@/src/lib/sku";

const CATEGORY_OPTIONS = ["Eye Guard", "Puller", "Folder", "Needle Plate", "Presser Foot", "Motor"];

function extractPartCodeFromSku(sku, seriesCode, hasBrand) {
  if (!sku) return "";
  const parts = sku.split("-");
  const searchSeries = String(seriesCode || "").trim().toUpperCase();

  if (searchSeries && parts.length >= 3 && parts[parts.length - 1].toUpperCase() === searchSeries) {
    return parts[parts.length - 2] || "";
  }

  let modelSeries = "";
  if (hasBrand) {
    modelSeries = parts.length >= 3 ? parts[2] : "";
  } else {
    modelSeries = parts.length >= 2 ? parts[1] : "";
  }

  if (!modelSeries) return "";
  const upperModelSeries = modelSeries.toUpperCase();
  if (searchSeries && upperModelSeries.endsWith(searchSeries)) {
    return modelSeries.slice(0, modelSeries.length - searchSeries.length);
  }

  return modelSeries;
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const sku = normalizeSku(params.sku);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageGroups, setImageGroups] = useState([[]]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [brandRecords, setBrandRecords] = useState([]);
  const [mode, setMode] = useState("brand");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandCreateValue, setBrandCreateValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [modelCreateValue, setModelCreateValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryCreateValue, setCategoryCreateValue] = useState("");
  const [partCode, setPartCode] = useState("");
  const [compatibleList, setCompatibleList] = useState([]);
  const [compatBrand, setCompatBrand] = useState("");
  const [compatBrandCreateValue, setCompatBrandCreateValue] = useState("");
  const [compatModelsInput, setCompatModelsInput] = useState("");
  const [partsIndex, setPartsIndex] = useState([]);
  const [seriesMap, setSeriesMap] = useState({});
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedSeriesProducts, setSelectedSeriesProducts] = useState([]);
  const [newSeriesCode, setNewSeriesCode] = useState("");
  const [newSeriesProductsInput, setNewSeriesProductsInput] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await api(`/api/parts/${encodeURIComponent(sku)}`);
        const data = response.data;
        setProduct(data);
        setExistingImages(data.images || []);
      } catch (error) {
        setStatusMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [sku]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await api("/api/brands");
        const data = response.data;
        if (Array.isArray(data)) {
          setBrandRecords(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadBrands();

    const loadParts = async () => {
      try {
        const res = await api('/api/parts');
        const data = res.data || [];
        setPartsIndex(data);
        const map = {};
        const latestUpdateForSeries = {};
        
        for (const p of data) {
          if (p.linkedSeries && p.linkedSeries.series) {
            const key = p.linkedSeries.series.trim();
            if (!key) continue;
            
            const pTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
            const currentLatest = latestUpdateForSeries[key]?.time || -1;
            
            if (pTime > currentLatest) {
              latestUpdateForSeries[key] = {
                time: pTime,
                products: p.linkedSeries.products || []
              };
            }
          }
        }
        
        for (const key in latestUpdateForSeries) {
          map[key] = latestUpdateForSeries[key].products.map(sku => ({ sku, code: sku, name: sku }));
        }
        setSeriesMap(map);
      } catch (e) {
        console.error(e);
      }
    };

    loadParts();
  }, []);

  useEffect(() => {
    if (!product) return;
    setMode("brand");
    setSelectedBrand(product.brandName || "");
    setBrandCreateValue("");
    const selectedBrandRecord = brandRecords.find((brand) => brand.name === product.brandName);
    const hasModel = selectedBrandRecord?.models?.some((model) => model.name === product.modelName);
    setSelectedModel(hasModel ? product.modelName : "+ Create new");
    setModelCreateValue(hasModel ? "" : product.modelName || "");

    const categoryRoot = product.categoryRoot?.trim() || "";
    const isKnownCategory = categoryRoot && CATEGORY_OPTIONS.includes(categoryRoot);
    setSelectedCategory(isKnownCategory ? categoryRoot : categoryRoot ? "+ Create new" : "");
    setCategoryCreateValue(isKnownCategory ? "" : categoryRoot);

    const initialSeriesCode = product.id1?.trim() || "";
    const initialPartCode = product.brandName?.trim()
      ? extractPartCodeFromSku(product.sku, initialSeriesCode, true)
      : product.id1?.trim() || extractPartCodeFromSku(product.sku, initialSeriesCode, false);
    setPartCode(initialPartCode);
    // Populate compatibleList from product
    let initialCompatList = [];
    if (product.compatibleBrands && product.compatibleBrands.length > 0) {
      initialCompatList = product.compatibleBrands.map((cb) => ({
        brand: cb.brand || "",
        machines: (cb.machines || []).map((m) => (typeof m === "string" ? m : m.model || "")).filter(Boolean),
      }));
    } else if (product.compat?.machineModels && product.compat.machineModels.length > 0) {
      const map = new Map();
      for (const item of product.compat.machineModels) {
        if (!item) continue;
        const matchedBrand = (brandRecords || []).find(
          (b) => b.name && item.toLowerCase().startsWith(b.name.toLowerCase())
        );
        if (matchedBrand) {
          const bName = matchedBrand.name;
          const modelOnly = item.slice(bName.length).trim();
          const set = map.get(bName) || new Set();
          set.add(modelOnly || item);
          map.set(bName, set);
        } else {
          const bName = "Other";
          const set = map.get(bName) || new Set();
          set.add(item);
          map.set(bName, set);
        }
      }
      initialCompatList = Array.from(map.entries()).map(([brand, set]) => ({
        brand,
        machines: Array.from(set),
      }));
    }
    setCompatibleList(initialCompatList);

    // Populate linkedSeries from product
    if (product.linkedSeries) {
      setSelectedSeries(product.linkedSeries.series || "");
      setSelectedSeriesProducts(product.linkedSeries.products || []);
    }
  }, [product, brandRecords]);

  const handleImageChange = (event, index) => {
    const files = Array.from(event.target.files || []);
    setImageGroups((prev) => {
      const next = [...prev];
      next[index] = files;
      return next;
    });
  };

  const addImageGroup = () => {
    setImageGroups((prev) => [...prev, []]);
  };

  const removeExistingImage = (imageUrl) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    setDeletedImages((prev) => [...prev, imageUrl]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Updating product...");

    try {
      const form = new FormData(event.currentTarget);
      form.delete("images");
      const uniqueFiles = new Map();
      imageGroups.flat().forEach((file) => {
        if (!file || typeof file.size !== "number") return;
        const fileKey = `${file.name}|${file.size}|${file.lastModified}`;
        if (!uniqueFiles.has(fileKey)) uniqueFiles.set(fileKey, file);
      });
      for (const file of uniqueFiles.values()) {
        form.append("images", file);
      }
      form.set("mode", mode);

      if (deletedImages.length > 0) {
        deletedImages.forEach((url) => form.append("deletedImageUrls", url));
      }

      const explicitPartCode = form.get("partCode")?.toString().trim();
      const explicitBrandName = form.get("brandName")?.toString().trim();
      const resolvedBrandName =
        explicitBrandName ||
        (selectedBrand === "+ Create new" ? brandCreateValue.trim() : selectedBrand.trim());
      const resolvedModelName =
        selectedModel === "+ Create new" ? modelCreateValue.trim() : selectedModel.trim();
      const categoryText =
        selectedCategory === "+ Create new" ? categoryCreateValue.trim() : selectedCategory.trim();
      const seriesCode = form.get("id1")?.toString().trim();
      const iscCode = form.get("id2")?.toString().trim();
      const hasBrandName = Boolean(resolvedBrandName);
      const parsedPartCode = hasBrandName
        ? extractPartCodeFromSku(product.sku, seriesCode, true)
        : product.id1?.trim() || extractPartCodeFromSku(product.sku, seriesCode, false);
      const resolvedPartCode = explicitPartCode || parsedPartCode || "";

      if (mode === "brand" && !resolvedBrandName) {
        setStatusMessage("Brand name is required to update the product.");
        setIsSubmitting(false);
        return;
      }

      if (mode === "brand" && selectedModel === "+ Create new" && !modelCreateValue.trim()) {
        setStatusMessage("Model name is required when creating a new model.");
        setIsSubmitting(false);
        return;
      }

      if (!resolvedPartCode) {
        setStatusMessage("Part code is required to generate SKU and product details.");
        setIsSubmitting(false);
        return;
      }

      if (!seriesCode) {
        setStatusMessage("Series code (Part #1) is required to generate SKU and product details.");
        setIsSubmitting(false);
        return;
      }

      form.set("brandName", resolvedBrandName || "");
      form.set("modelName", resolvedModelName || "");
      form.set("categoryRoot", categoryText);
      form.set("partCode", resolvedPartCode);

      const generatedSku = buildSku(
        categoryText,
        resolvedPartCode,
        seriesCode,
        iscCode || "",
        resolvedBrandName,
      );
      const generatedName = buildProductName(
        categoryText,
        resolvedPartCode,
        seriesCode,
        iscCode || "",
        resolvedBrandName,
      );

      form.set("name", generatedName);
      form.set("sku", generatedSku);
      // consolidate compatibleList by brand (merge machines) before sending
      const consolidate = (list) => {
        const map = new Map();
        for (const item of list || []) {
          const b = (item.brand || "").trim();
          if (!b) continue;
          const set = map.get(b) || new Set();
          for (const m of item.machines || []) set.add(m);
          map.set(b, set);
        }
        return Array.from(map.entries()).map(([brand, set]) => ({
          brand,
          machines: Array.from(set).map((model) => ({ model }))
        }));
      };

      form.set("compatibleBrands", JSON.stringify(consolidate(compatibleList || [])));

      // Use resolved seriesCode as the series key
      const resolvedSeriesProducts = [...new Set(selectedSeriesProducts || [])];
      const finalLinkedSeriesKey = selectedSeries || seriesCode;
      form.set("linkedSeries", JSON.stringify({ series: finalLinkedSeriesKey, products: resolvedSeriesProducts }));

      await api(`/api/parts/${encodeURIComponent(sku)}`, {
        method: "PUT",
        data: form,
      });

      setStatusMessage("Product updated successfully.");
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.error || error.response?.data?.message;
      setStatusMessage(serverMsg || error.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Edit product" subtitle="Update product details">
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading product...
        </div>
      </AdminShell>
    );
  }

  if (!product) {
    return (
      <AdminShell title="Edit product" subtitle="Update product details">
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Product not found
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Edit product" subtitle={`Update ${product.name}`}>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <input
          type="hidden"
          name="categoryRoot"
          value={
            selectedCategory === "+ Create new"
              ? categoryCreateValue.trim()
              : selectedCategory.trim()
          }
        />
        <input type="hidden" name="partCode" value={partCode} />
        <div className="lg:col-span-2 space-y-6">
          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Step 01 · Classify
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("brand");
                  setSelectedBrand(product.brandName || "");
                  setSelectedModel(product.modelName || "");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                }}
                className={`w-full hairline p-4 text-left ${mode === "brand" ? "bg-ink text-bone" : "hover:bg-secondary"}`}
              >
                <div className="font-display text-2xl">Brand</div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-70 mt-1">
                  e.g. JUKI · DDL-8700
                </div>
              </button>
            </div>

            <div
              className={`mt-4 grid ${mode === "brand" ? "sm:grid-cols-3" : "sm:grid-cols-1"} gap-3`}
            >
              {mode === "brand" ? (
                <>
                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                      Brand
                    </span>
                    <select
                      className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                      value={selectedBrand}
                      onChange={(event) => {
                        setSelectedBrand(event.target.value);
                        if (event.target.value !== "+ Create new") {
                          setBrandCreateValue("");
                        }
                      }}
                    >
                      <option value="">Select brand</option>
                      {brandRecords
                        .filter((brand) => brand.isBrand !== false)
                        .map((brand) => (
                          <option key={brand.slug || brand.name} value={brand.name}>
                            {brand.name}
                          </option>
                        ))}
                      <option value="+ Create new">+ Create new</option>
                    </select>
                    {selectedBrand === "+ Create new" && (
                      <input
                        type="text"
                        value={brandCreateValue}
                        onChange={(event) => setBrandCreateValue(event.target.value)}
                        placeholder="Create new brand"
                        className="border-2 bg-background outline-none focus:border-copper mt-2 py-2 pl-3 w-full"
                      />
                    )}
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                      Model
                    </span>
                    <select
                      className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                      value={selectedModel}
                      onChange={(event) => {
                        setSelectedModel(event.target.value);
                        if (event.target.value !== "+ Create new") {
                          setModelCreateValue("");
                        }
                      }}
                    >
                      <option value="">Select model</option>
                      {(() => {
                        const selectedBrandRecord = brandRecords.find(
                          (brand) => brand.name === selectedBrand,
                        );
                        return (selectedBrandRecord?.models || []).map((model) => (
                          <option key={model.slug || model.name} value={model.name}>
                            {model.name}
                          </option>
                        ));
                      })()}
                      <option value="+ Create new">+ Create new</option>
                    </select>
                    {selectedModel === "+ Create new" && (
                      <input
                        type="text"
                        value={modelCreateValue}
                        onChange={(event) => setModelCreateValue(event.target.value)}
                        placeholder="Create new model"
                        className="border-2 bg-background outline-none focus:border-copper mt-2 py-2 pl-3 w-full"
                      />
                    )}
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                      Category (optional)
                    </span>
                    <select
                      className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                      value={selectedCategory}
                      onChange={(event) => {
                        setSelectedCategory(event.target.value);
                        if (event.target.value !== "+ Create new") setCategoryCreateValue("");
                      }}
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="+ Create new">+ Create new</option>
                    </select>
                    {selectedCategory === "+ Create new" && (
                      <input
                        type="text"
                        value={categoryCreateValue}
                        onChange={(event) => setCategoryCreateValue(event.target.value)}
                        placeholder="Create new category"
                        className="border-2 bg-background outline-none focus:border-copper mt-2 py-2 pl-3 w-full"
                      />
                    )}
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Department</span>
                    <input name="taxonomy.department" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" placeholder="Machine Parts" defaultValue={product.taxonomy?.department || ""} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Sub-category</span>
                    <input name="taxonomy.subCategory" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" placeholder="Hemmer Foot" defaultValue={product.taxonomy?.subCategory || ""} />
                  </label>
                </>
              ) : null}
            </div>
          </section>

          <section className="hairline bg-card p-6">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">Manufacturer</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Inp name="manufacturer" label="Manufacturer" placeholder="JUKI" defaultValue={product.manufacturer} />
              <Inp name="manufacturerCountry" label="Manufacturer country" placeholder="Japan" defaultValue={product.manufacturerCountry} />
            </div>
            <div className="mt-3">
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Status</span>
                <select name="status" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" defaultValue={product.status || "Active"}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </label>
            </div>
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Product Details
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Inp
                label="Product name"
                name="name"
                placeholder="Rotary Hook Assembly"
                defaultValue={product.name}
              />
              <Inp
                label="SKU"
                name="sku"
                placeholder="SKU-JUKI-HX48300"
                mono
                defaultValue={product.sku}
                disabled
              />
              <Inp
                label="Part # (id1)"
                name="id1"
                placeholder="HX-48300"
                mono
                defaultValue={product.id1}
              />
              <Inp
                label="Part # (id2)"
                name="id2"
                placeholder="KD14"
                mono
                defaultValue={product.id2}
              />
              <Inp
                label="Diagram #"
                name="diagramNumber"
                placeholder="D-112"
                mono
                defaultValue={product.diagramNumber}
              />
              <Inp
                label="Alt part #s (comma-sep)"
                name="altPartNumbers"
                placeholder="B1830-372-OAO, 229-26309"
                mono
                defaultValue={product.altPartNumbers?.join(", ")}
              />
            </div>
            <Inp
              label="Description"
              name="description"
              placeholder="Hardened steel rotary hook…"
              textarea
              defaultValue={product.description}
            />
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Compatibility & Specs
            </div>

            <div className="space-y-3 mb-6">
              <div className="font-mono text-[11px] tracking-widest uppercase text-copper">Compatibility (existing brands/models)</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Brand</span>
                  <select
                    className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                    value={compatBrand}
                    onChange={(e) => {
                      setCompatBrand(e.target.value);
                      if (e.target.value !== "+ Create new") {
                        setCompatBrandCreateValue("");
                      }
                    }}
                  >
                    <option value="">Select brand</option>
                    {brandRecords.map((b) => (
                      <option key={b.slug || b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="+ Create new">+ Create new</option>
                  </select>
                  {compatBrand === "+ Create new" && (
                    <input
                      type="text"
                      value={compatBrandCreateValue}
                      onChange={(e) => setCompatBrandCreateValue(e.target.value)}
                      placeholder="Enter new brand name"
                      className="border hairline bg-background outline-none focus:border-copper mt-2 py-2 px-3 text-sm w-full"
                    />
                  )}
                </label>

                <label className="block">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Models (comma-separated)</span>
                  <input
                    className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                    value={compatModelsInput}
                    onChange={(e) => setCompatModelsInput(e.target.value)}
                    placeholder="DDL-8700, DDL-9000"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      const targetBrand = compatBrand === "+ Create new" ? compatBrandCreateValue.trim() : compatBrand.trim();
                      if (!targetBrand) return;

                      const models = compatModelsInput
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (models.length === 0) return;

                      setCompatibleList((prev) => {
                        const map = new Map();
                        for (const item of prev) {
                          const key = (item.brand || "").trim();
                          if (!key) continue;
                          const set = map.get(key) || new Set();
                          for (const m of item.machines || []) set.add(m);
                          map.set(key, set);
                        }
                        const incomingKey = targetBrand;
                        const incomingSet = map.get(incomingKey) || new Set();
                        for (const m of models) incomingSet.add(m);
                        map.set(incomingKey, incomingSet);

                        const merged = [];
                        for (const [brand, setVals] of map.entries()) {
                          merged.push({ brand, machines: Array.from(setVals) });
                        }
                        return merged;
                      });

                      if (!brandRecords.some((b) => b.name?.toLowerCase() === targetBrand.toLowerCase())) {
                        setBrandRecords((prev) => [
                          ...prev,
                          { slug: targetBrand.toLowerCase().replace(/\s+/g, "-"), name: targetBrand, isBrand: true, models: [] },
                        ]);
                      }

                      setCompatBrand("");
                      setCompatBrandCreateValue("");
                      setCompatModelsInput("");
                    }}
                    className="w-full h-10 bg-ink text-bone"
                  >
                    Add
                  </button>
                </div>
              </div>

              {compatibleList.length > 0 && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] uppercase flex justify-between items-center">
                    <span>Added compatibility</span>
                    <button
                      type="button"
                      onClick={() => setCompatibleList([])}
                      className="text-red-500 text-[9px] font-mono hover:underline uppercase"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    {compatibleList.map((c, i) => (
                      <li key={i} className="text-xs flex justify-between items-center max-w-md">
                        <span>
                          {c.brand}: {Array.from(new Set(c.machines)).join(", ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCompatibleList((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 font-mono text-[10px]"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="font-mono text-[11px] tracking-widest uppercase text-copper mt-4">Series linking</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Series code</span>
                  <select
                    className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                    value={selectedSeries}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSeries(val);
                      setSelectedSeriesProducts(val ? (seriesMap[val] || []).map((p) => p.sku) : []);
                    }}
                  >
                    <option value="">Select series</option>
                    {Object.keys(seriesMap).map((code) => (
                      <option key={code} value={code}>
                        {code} ({seriesMap[code].length} products)
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Products in series</div>
                  <div className="mt-2 border hairline p-4 bg-secondary/10">
                    {selectedSeries ? (
                      <div className="text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-copper text-base">Products in Series ({selectedSeries})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextMap = { ...seriesMap };
                              delete nextMap[selectedSeries];
                              setSeriesMap(nextMap);
                              setSelectedSeries("");
                              setSelectedSeriesProducts([]);
                            }}
                            className="text-red-500 hover:underline text-[10px] uppercase font-mono tracking-wider"
                          >
                            Remove Series
                          </button>
                        </div>
                        
                        <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground mb-3 mt-4">
                          Sub Category
                        </div>
                        <div className="mb-4 flex flex-col space-y-2 pl-2">
                          {(seriesMap[selectedSeries] || []).map((p, i) => {
                            const code = p.code || p.id2 || p.sku || p.name || "";
                            return (
                              <label key={p.sku} className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={p.sku}
                                  checked={selectedSeriesProducts.includes(p.sku)}
                                  onChange={(e) => {
                                    const skuVal = e.target.value;
                                    setSelectedSeriesProducts((prev) =>
                                      e.target.checked ? [...prev, skuVal] : prev.filter((s) => s !== skuVal),
                                    );
                                  }}
                                  className="mr-3 accent-copper h-4 w-4"
                                />
                                <span className="font-mono text-sm">{code}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="border-t border-dashed pt-3 mt-2">
                          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Edit Series Info</div>
                          <div className="grid sm:grid-cols-2 gap-3 mb-2" key={selectedSeries}>
                            <label className="block">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Series</span>
                              <input
                                className="mt-1 w-full hairline bg-background px-3 py-2 text-xs outline-none focus:border-copper"
                                placeholder="Update Series Code"
                                id="editSeriesName"
                                defaultValue={selectedSeries}
                              />
                            </label>
                            <label className="block">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Info</span>
                              <input
                                className="mt-1 w-full hairline bg-background px-3 py-2 text-xs outline-none focus:border-copper"
                                placeholder="Comma-separated products"
                                id="editSeriesProducts"
                                defaultValue={(seriesMap[selectedSeries] || []).map(p => p.code || p.id2 || p.sku || p.name).join(", ")}
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newName = document.getElementById("editSeriesName").value.trim();
                              const newProds = document.getElementById("editSeriesProducts").value.split(",").map(s => s.trim()).filter(Boolean);
                              if (!newName) return;
                              const nextMap = { ...seriesMap };
                              if (newName !== selectedSeries) {
                                delete nextMap[selectedSeries];
                              }
                              nextMap[newName] = newProds.map(p => {
                                const existing = (seriesMap[selectedSeries] || []).find(old => (old.sku === p || old.code === p || old.name === p || old.id2 === p));
                                return existing || { sku: p, code: p, name: p };
                              });
                              setSeriesMap(nextMap);
                              setSelectedSeries(newName);
                              setSelectedSeriesProducts(prev => {
                                const notInThisSeries = prev.filter(sku => !(seriesMap[selectedSeries] || []).some(old => old.sku === sku));
                                return [...notInThisSeries, ...newProds];
                              });
                            }}
                            className="w-full h-8 bg-secondary hover:bg-copper hover:text-bone text-xs font-mono uppercase tracking-widest transition-colors"
                          >
                            Update Series
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-1">
                          <div className="font-mono text-[10px] tracking-widest uppercase text-copper">Create new series</div>
                          <div className="grid sm:grid-cols-2 gap-3 mt-2">
                            <label className="block">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Series code</span>
                              <input
                                className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                                value={newSeriesCode}
                                onChange={(e) => setNewSeriesCode(e.target.value)}
                                placeholder="1.1.1"
                              />
                            </label>

                            <label className="block">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Products (comma-separated)</span>
                              <input
                                className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                                value={newSeriesProductsInput}
                                onChange={(e) => setNewSeriesProductsInput(e.target.value)}
                                placeholder="1.1, 1.2, 1.3, 1.4, 1.5"
                              />
                            </label>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const code = (newSeriesCode || "").toString().trim();
                                  if (!code) return;
                                  const products = (newSeriesProductsInput || "")
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  const nextMap = { ...seriesMap };
                                  nextMap[code] = products.map((p) => ({ sku: p, code: p, name: p }));
                                  setSeriesMap(nextMap);
                                  setSelectedSeries(code);
                                  setSelectedSeriesProducts(products.map((p) => p));
                                  setNewSeriesCode("");
                                  setNewSeriesProductsInput("");
                                }}
                                className="w-full h-10 bg-ink text-bone"
                              >
                                Create series
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-4 pt-4 border-t">Choose a series to view and edit products.</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>


            <div className="grid sm:grid-cols-3 gap-3">
              <Inp
                name="compatNeedleSystem"
                label="Needle system"
                placeholder="DBx1"
                defaultValue={product.compat?.needleSystem}
              />
              <Inp
                name="compatThreadType"
                label="Thread type"
                placeholder="Polyester or Cotton"
                defaultValue={product.compat?.threadType}
              />
              <Sel
                name="compatStitchType"
                label="Stitch type"
                options={["Lockstitch", "Overlock", "Chainstitch", "Coverstitch"]}
                defaultValue={product.compat?.stitchType?.[0]}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Inp
                name="specsMaterial"
                label="Material"
                placeholder="Hardened steel"
                defaultValue={product.specs?.material}
              />
              <Inp
                name="specsWeight"
                label="Weight"
                placeholder="65g"
                defaultValue={product.specs?.weight}
              />
              <Inp
                name="maintenanceReplacementHours"
                label="Replacement (hrs)"
                placeholder="5000"
                defaultValue={product.maintenance?.replacementInterval_hours}
              />
            </div>
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Existing Images
            </div>

            {existingImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((imageUrl) => (
                  <div key={imageUrl} className="relative group">
                    <img src={imageUrl} alt="Product" className="h-24 w-24 object-cover hairline" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(imageUrl)}
                      className="absolute top-1 right-1 h-6 w-6 bg-destructive text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No images</div>
            )}
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Add/Replace Images
            </div>

            <div className="space-y-3">
              {imageGroups.map((group, index) => (
                <label
                  key={index}
                  className="hairline border-dashed bg-secondary/30 p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-ink"
                >
                  <Upload className="h-7 w-7 text-muted-foreground" />

                  <div className="font-mono text-[11px] uppercase tracking-widest">
                    Upload image set {index + 1}
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    PNG, JPG up to 5MB · select multiple files
                  </div>

                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={(event) => handleImageChange(event, index)}
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={addImageGroup}
              className="w-full h-10 border border-dashed border-copper/60 text-copper font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-secondary"
            >
              + Add more images
            </button>

            {imageGroups.flat().length > 0 && (
              <div className="font-mono text-[11px] text-muted-foreground">
                {imageGroups.flat().length} image(s) selected
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-1 space-y-4">
          <section className="hairline bg-card p-6">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-4">
              Pricing & Stock
            </div>

            <div className="space-y-3">
              <Inp name="price" label="Price (₹)" placeholder="2450" defaultValue={product.price} />
              <Inp
                name="compareAt"
                label="Compare-at price (₹)"
                placeholder="2800"
                defaultValue={product.compareAt}
              />
              <Inp name="stock" label="Stock" placeholder="42" defaultValue={product.stock} />
              <Inp name="stockAlert" label="Needed stock alert" placeholder="20" defaultValue={product.stockAlert} />

              <label className="flex items-center gap-2 text-sm pt-2">
                <input
                  type="checkbox"
                  name="hasMotor"
                  className="accent-copper"
                  defaultChecked={product.hasMotor}
                />
                Contains motor (18% GST)
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" className="accent-copper" defaultChecked={product.status === "Active" || product.active !== false} />
                Active in store
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-ink text-bone hover:bg-copper font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
          {statusMessage && (
            <div
              className={`text-sm ${statusMessage.includes("successfully") ? "text-green-600" : "text-muted-foreground"} mt-2`}
            >
              {statusMessage}
            </div>
          )}
        </aside>
      </form>
    </AdminShell>
  );
}

function Inp({ label, placeholder, mono, textarea, name, defaultValue, disabled }) {
  const cls = `mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper ${mono ? "font-mono" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </span>

      {textarea ? (
        <textarea
          name={name}
          rows={3}
          className={`${cls} resize-none`}
          placeholder={placeholder}
          defaultValue={defaultValue}
          disabled={disabled}
        />
      ) : (
        <input
          name={name}
          className={cls}
          placeholder={placeholder}
          defaultValue={defaultValue}
          disabled={disabled}
        />
      )}
    </label>
  );
}

function Sel({ label, options, name, defaultValue }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </span>

      <select
        name={name}
        className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
        defaultValue={defaultValue || ""}
      >
        <option value="">Select option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
