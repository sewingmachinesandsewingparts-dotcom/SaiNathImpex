"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save } from "lucide-react";
import { AdminShell } from "@/src/components/admin-shell";
import axios from 'axios';
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
  const [selectedBrand, setSelectedBrand] = useState("");
  const [brandCreateValue, setBrandCreateValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [modelCreateValue, setModelCreateValue] = useState("");
  const [categoryCreateValue, setCategoryCreateValue] = useState("");
  const [brandNameOverride, setBrandNameOverride] = useState("");

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await axios("/api/brands");
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setBrandRecords(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadBrands();
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Saving product...");

    try {
      const form = new FormData(event.currentTarget);
      const skuValue = form.get("sku")?.toString().trim();
      if (!skuValue) {
        const fallbackSku = `PART-${Date.now().toString().slice(-6)}`;
        form.set("sku", fallbackSku);
      }
      form.set("mode", mode);
      imageGroups.flat().forEach((file) => form.append("images", file));
      const explicitPartCode = form.get("brandNameOverride")?.toString().trim();
      const categoryValue = selectedCategory === "+ Create new"
        ? categoryCreateValue.trim()
        : selectedCategory.trim();
      const categoryText = categoryValue;
      const resolvedBrandName = mode === "category"
        ? "Others"
        : selectedBrand === "+ Create new"
        ? brandCreateValue.trim()
        : selectedBrand.trim();
      const resolvedModelName = mode === "category"
        ? categoryText
        : selectedModel === "+ Create new"
        ? modelCreateValue.trim()
        : selectedModel.trim();
      const resolvedPartCode = explicitPartCode;

      if (!categoryText) {
        setStatusMessage("Category is required to generate product details.");
        setIsSubmitting(false);
        return;
      }

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

      if (selectedCategory === "+ Create new" && !categoryCreateValue.trim()) {
        setStatusMessage("Category name is required when creating a new category.");
        setIsSubmitting(false);
        return;
      }

      form.set("brandName", resolvedBrandName || "");
      form.set("modelName", resolvedModelName || "");

      const seriesCode = form.get("seriesCode")?.toString().trim();
      const iscCode = form.get("iscCode")?.toString().trim();
      const generatedSku = buildSku(
        categoryText,
        resolvedPartCode,
        seriesCode || "",
        iscCode || "",
        mode === "brand" ? resolvedBrandName : "",
      );
      const generatedName = buildProductName(
        categoryText,
        resolvedPartCode,
        seriesCode || "",
        iscCode || "",
        mode === "brand" ? resolvedBrandName : "",
      );

      if (!seriesCode) {
        setStatusMessage("Series code is required to generate SKU and part number.");
        setIsSubmitting(false);
        return;
      }

      form.set("categoryRoot", categoryText);
      form.set("name", generatedName);
      form.set("sku", generatedSku);
      form.set("id1", seriesCode);
      form.set("id2", iscCode || "");

      const response = await axios.post("/api/parts", form);

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
        <div className="lg:col-span-2 space-y-6">
          <section className="hairline bg-card p-6">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-4">
              Step 01 · Classify
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
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
                className={`hairline p-4 text-left ${
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
                  setSelectedBrand("Others");
                  setSelectedModel("");
                  setSelectedCategory("");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                }}
                className={`hairline p-4 text-left ${
                  mode === "category" ? "bg-ink text-bone" : "hover:bg-secondary"
                }`}
              >
                <div className="font-display text-2xl">Universal / Others</div>
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
                </>
              ) : null}

              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Category
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
              <Inp label="Series code" name="seriesCode" placeholder="35000" mono required />
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

            <Inp
              label="Compatible machines (comma-sep)"
              name="compatMachineModels"
              placeholder="JUKI DDL-8700, JUKI DDL-9000"
            />

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
                    name="images"
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
