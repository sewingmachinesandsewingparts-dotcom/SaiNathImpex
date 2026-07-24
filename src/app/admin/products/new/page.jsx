"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save } from "lucide-react";
import { AdminShell } from "@/src/components/admin-shell";
import api from "@/src/utils/api";
import { buildProductName, buildSku } from "@/src/lib/sku";

const BRANDS = [
  { slug: "juki", name: "JUKI", isBrand: true, models: [{ slug: "ddl-8700", name: "DDL-8700" }] },
  { slug: "siruba", name: "SIRUBA", isBrand: true, models: [{ slug: "s-7200c", name: "S-7200C" }] },
  {
    slug: "brother",
    name: "BROTHER",
    isBrand: true,
    models: [{ slug: "988-700k", name: "988/700K" }],
  },
  { slug: "jack", name: "JACK", isBrand: true, models: [] },
  { slug: "pegasus", name: "PEGASUS", isBrand: true, models: [] },
];

const CATEGORY_OPTIONS = ["Eye Guard", "Puller", "Folder", "Needle Plate", "Presser Foot", "Motor"];

export default function NewProductPage() {
  const router = useRouter();
  const [mode, setMode] = useState("brand");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageGroups, setImageGroups] = useState([[]]);
  const [brandRecords, setBrandRecords] = useState(BRANDS);
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
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandCreateValue, setBrandCreateValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [modelCreateValue, setModelCreateValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryCreateValue, setCategoryCreateValue] = useState("");
  const [brandNameOverride, setBrandNameOverride] = useState("");

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await api("/api/brands");
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
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

  const categoryText = selectedCategory === "+ Create new" ? categoryCreateValue.trim() : selectedCategory.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Saving product...");

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
      const skuValue = form.get("sku")?.toString().trim();
      if (!skuValue) {
        const fallbackSku = `PART-${Date.now().toString().slice(-6)}`;
        form.set("sku", fallbackSku);
      }
      form.set("mode", mode);
      const explicitPartCode = form.get("brandNameOverride")?.toString().trim();
      const resolvedBrandName = selectedBrand === "+ Create new" ? brandCreateValue.trim() : selectedBrand.trim();
      const resolvedModelName = selectedModel === "+ Create new" ? modelCreateValue.trim() : selectedModel.trim();
      const resolvedPartCode = explicitPartCode;

      if (!resolvedPartCode) {
        setStatusMessage("Part code is required to generate SKU and product details.");
        setIsSubmitting(false);
        return;
      }

      if (mode === "brand" && !resolvedBrandName) {
        setStatusMessage("Brand name is required to generate the SKU.");
        setIsSubmitting(false);
        return;
      }

      if (mode === "brand" && selectedModel === "+ Create new" && !modelCreateValue.trim()) {
        setStatusMessage("Model name is required when creating a new model.");
        setIsSubmitting(false);
        return;
      }

      if (selectedModel === "+ Create new" && !modelCreateValue.trim()) {
        setStatusMessage("Model name is required when creating a new model.");
        setIsSubmitting(false);
        return;
      }

      form.set("brandName", resolvedBrandName || "");
      form.set("modelName", resolvedModelName || "");
      form.set("categoryRoot", categoryText);

      const seriesCode = form.get("seriesCode")?.toString().trim();
      const iscCode = form.get("iscCode")?.toString().trim();
      const generatedSku = buildSku(categoryText, resolvedPartCode, seriesCode || "", iscCode || "", mode === "brand" ? resolvedBrandName : "");
      const generatedName = buildProductName(categoryText, resolvedPartCode, seriesCode || "", iscCode || "", mode === "brand" ? resolvedBrandName : "");

      if (!seriesCode) {
        setStatusMessage("Series code is required to generate SKU and part number.");
        setIsSubmitting(false);
        return;
      }

      form.set("name", generatedName);
      form.set("sku", generatedSku);
      form.set("id1", seriesCode);
      form.set("id2", iscCode || "");

      // Set linkedSeries using the resolved seriesCode as the key
      const resolvedSeriesProducts = [...new Set(selectedSeriesProducts || [])];
      const finalLinkedSeriesKey = selectedSeries || seriesCode;
      form.set("linkedSeries", JSON.stringify({ series: finalLinkedSeriesKey, products: resolvedSeriesProducts }));

      const response = await api.post("/api/parts", form);

      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || "Failed to save product.");
      }

      setStatusMessage("Product saved successfully.");
      router.push("/admin/products");
    } catch (error) {
      console.error(error.response?.data || error);
      const message = error.response?.data?.message || error.message || "Failed to save product.";
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell title="New product" subtitle="Add a part to the catalog">
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <input type="hidden" name="categoryRoot" value={categoryText} />
        <div className="lg:col-span-2 space-y-6">
          <section className="hairline bg-card p-6">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-4">
              Step 01 · Classify
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("brand");
                  setSelectedBrand("");
                  setSelectedModel("");
                  setSelectedCategory("");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                }}
                className={`w-full hairline p-4 text-left ${
                  mode === "brand" ? "bg-ink text-bone" : "hover:bg-secondary"
                }`}
              >
                <div className="font-display text-2xl">Brand</div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-70 mt-1">
                  e.g. JUKI · DDL-8700
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("category");
                  setSelectedBrand("");
                  setSelectedModel("");
                  setSelectedCategory("");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                }}
                className={`hairline p-4 text-left ${
                  mode === "category" ? "bg-ink text-bone" : "hover:bg-secondary"
                }`}
              >
                <div className="font-display text-2xl">Category</div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-70 mt-1">
                  e.g. Eye Guard · Motor
                </div>
              </button>
            </div>

            <div className={`mt-4 grid ${mode === "brand" ? "sm:grid-cols-3" : "sm:grid-cols-1"} gap-3`}>
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
                        if (event.target.value !== "+ Create new") {
                          setCategoryCreateValue("");
                        }
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
                    <input name="taxonomy.department" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" placeholder="Machine Parts" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Sub-category</span>
                    <input name="taxonomy.subCategory" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" placeholder="Hemmer Foot" />
                  </label>
                </>
              ) : (
                <label className="block">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                    Category (optional)
                  </span>
                  <select
                    className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
                    value={selectedCategory}
                    onChange={(event) => {
                      setSelectedCategory(event.target.value);
                      if (event.target.value !== "+ Create new") {
                        setCategoryCreateValue("");
                      }
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
              )}
            </div>
          </section>

          <section className="hairline bg-card p-6">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">Manufacturer</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Inp name="manufacturer" label="Manufacturer" placeholder="JUKI" />
              <Inp name="manufacturerCountry" label="Manufacturer country" placeholder="Japan" />
            </div>
            <div className="mt-3">
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Status</span>
                <select name="status" className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </label>
            </div>
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Step 02 · Details
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Inp
                label={mode === "brand" ? "Brand code" : "Product code"}
                name="brandNameOverride"
                value={brandNameOverride}
                onChange={(e) => setBrandNameOverride(e.target.value)}
                placeholder="Hx"
                mono
                required
              />
              <Inp label="Series code" name="seriesCode" placeholder="1.1.1" mono required />
              <Inp label="ISC code" name="iscCode" placeholder="747D" mono />
              <Inp label="Diagram #" name="diagramNumber" placeholder="D-112" mono />
              <Inp
                label="Alt part #s (comma-sep)"
                name="altPartNumbers"
                placeholder="B1830-372-OAO, 229-26309"
                mono
              />
            </div>

            <Inp
              label="Description"
              name="description"
              placeholder="Hardened steel rotary hook…"
              textarea
            />
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Step 03 · Compatibility & Specs
            </div>
            <div className="space-y-3">
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
                  <input className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" value={compatModelsInput} onChange={(e)=>setCompatModelsInput(e.target.value)} placeholder="DDL-8700, DDL-9000" />
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
                  <select className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper" value={selectedSeries} onChange={(e)=>{
                    const val = e.target.value; setSelectedSeries(val);
                    setSelectedSeriesProducts(val ? (seriesMap[val] || []).map(p => p.sku) : []);
                  }}>
                    <option value="">Select series</option>
                    {Object.keys(seriesMap).map(code=> <option key={code} value={code}>{code} ({seriesMap[code].length} products)</option>)}
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
                                    const sku = e.target.value;
                                    setSelectedSeriesProducts((prev) =>
                                      e.target.checked ? [...prev, sku] : prev.filter((s) => s !== sku),
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
                            <button type="button" onClick={() => {
                              const code = (newSeriesCode || "").toString().trim();
                              if (!code) return;
                              const products = (newSeriesProductsInput || "").split(',').map(s=>s.trim()).filter(Boolean);
                              const nextMap = { ...seriesMap };
                              nextMap[code] = products.map(p=>({ sku: p, code: p, name: p }));
                              setSeriesMap(nextMap);
                              setSelectedSeries(code);
                              setSelectedSeriesProducts(products.map(p=>p));
                              setNewSeriesCode("");
                              setNewSeriesProductsInput("");
                            }} className="w-full h-10 bg-ink text-bone">Create series</button>
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
              <Inp name="compatNeedleSystem" label="Needle system" placeholder="DBx1" />
              <Inp name="compatThreadType" label="Thread type" placeholder="Polyester or Cotton" />
              <Sel
                name="compatStitchType"
                label="Stitch type"
                options={["Lockstitch", "Overlock", "Chainstitch", "Coverstitch"]}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Inp name="specsMaterial" label="Material" placeholder="Hardened steel" />
              <Inp name="specsWeight" label="Weight" placeholder="65g" />
              <Inp
                name="maintenanceReplacementHours"
                label="Replacement (hrs)"
                placeholder="5000"
              />
            </div>
          </section>

          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Step 04 · Images
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
                {imageGroups.flat().length} image(s) selected across {imageGroups.length} upload
                slot(s)
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
              <Inp name="price" label="Price (₹)" placeholder="2450" required />
              <Inp name="compareAt" label="Compare-at price (₹)" placeholder="2800" />
              <Inp name="stock" label="Stock" placeholder="42" />
              <Inp name="stockAlert" label="Needed stock alert" placeholder="20" />

              <label className="flex items-center gap-2 text-sm pt-2">
                <input type="checkbox" name="hasMotor" className="accent-copper" />
                Contains motor (18% GST)
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-copper" defaultChecked />
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
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
          {statusMessage && (
            <div className="text-sm text-muted-foreground mt-2">{statusMessage}</div>
          )}
        </aside>
      </form>
    </AdminShell>
  );
}

function Inp({ label, placeholder, mono, textarea, name, ...props }) {
  const cls = `mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper ${mono ? "font-mono" : ""}`;

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
          {...props}
        />
      ) : (
        <input name={name} className={cls} placeholder={placeholder} {...props} />
      )}
    </label>
  );
}

function Sel({ label, options, mode, name }) {
  const [selectedBrand, setSelectedBrand] = useState("");

  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </span>

      <select
        name={name}
        className="mt-1 w-full hairline bg-background px-3 py-2.5 text-sm outline-none focus:border-copper"
        onChange={(e) => setSelectedBrand(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {(label !== "Category root" && options.length < 2) || selectedBrand === "+ Create new" ? (
        <input
          type="text"
          placeholder={`Enter the ${mode} Name`}
          className="border-2 bg-background outline-none focus:border-copper mt-2 py-2 pl-3 w-full"
        />
      ) : null}
    </label>
  );
}
