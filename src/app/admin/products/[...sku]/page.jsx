"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Save, X } from "lucide-react";
import { AdminShell } from "@/src/components/admin-shell";
import axios from 'axios';

const CATEGORY_OPTIONS = ["Eye Guard", "Puller", "Folder", "Needle Plate", "Presser Foot", "Motor"];

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

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await axios(`/api/parts/${encodeURIComponent(sku)}`);
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
        const response = await axios("/api/brands");
        const data = response.data;
        if (Array.isArray(data)) {
          setBrandRecords(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadBrands();
  }, []);

  useEffect(() => {
    if (!product) return;
    const isCategory = product.brandName === "Others";
    setMode(isCategory ? "category" : "brand");
    setSelectedBrand(isCategory ? "Others" : product.brandName || "");
    setBrandCreateValue("");

    if (isCategory) {
      const matchedCategory = CATEGORY_OPTIONS.includes(product.modelName) ? product.modelName : "+ Create new";
      setSelectedCategory(matchedCategory);
      setCategoryCreateValue(matchedCategory === "+ Create new" ? product.modelName || "" : "");
      setSelectedModel("");
      setModelCreateValue("");
    } else {
      setSelectedCategory("");
      const selectedBrandRecord = brandRecords.find((brand) => brand.name === product.brandName);
      const hasModel = selectedBrandRecord?.models?.some((model) => model.name === product.modelName);
      setSelectedModel(hasModel ? product.modelName : "+ Create new");
      setModelCreateValue(hasModel ? "" : product.modelName || "");
      setCategoryCreateValue("");
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
      form.set("mode", mode);
      imageGroups.flat().forEach((file) => form.append("images", file));

      if (deletedImages.length > 0) {
        deletedImages.forEach((url) => form.append("deletedImageUrls", url));
      }

      const explicitBrandName = form.get("brandName")?.toString().trim();
      const categoryValue = selectedCategory === "+ Create new"
        ? categoryCreateValue.trim()
        : selectedCategory.trim();
      const resolvedBrandName = mode === "category"
        ? "Others"
        : explicitBrandName || (selectedBrand === "+ Create new" ? brandCreateValue.trim() : selectedBrand.trim());
      const resolvedModelName = mode === "category"
        ? categoryValue
        : selectedModel === "+ Create new"
        ? modelCreateValue.trim()
        : selectedModel.trim();

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

      if (mode === "category" && !categoryValue) {
        setStatusMessage("Category is required to update the product.");
        setIsSubmitting(false);
        return;
      }

      form.set("brandName", resolvedBrandName || "");
      form.set("modelName", resolvedModelName || "");
      form.set("categoryRoot", categoryValue || "");

      await axios(`/api/parts/${encodeURIComponent(sku)}`, {
        method: "PUT",
        data: form,
      });

      setStatusMessage("Product updated successfully.");
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || "Failed to update product.");
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
        <div className="lg:col-span-2 space-y-6">
          <section className="hairline bg-card p-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest uppercase text-copper mb-2">
              Step 01 · Classify
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("brand");
                  setSelectedBrand(product.brandName === "Others" ? "" : product.brandName || "");
                  setSelectedModel(product.brandName === "Others" ? "" : product.modelName || "");
                  setSelectedCategory("");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                  setCategoryCreateValue("");
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
                  setSelectedCategory(product.brandName === "Others" ? (CATEGORY_OPTIONS.includes(product.modelName) ? product.modelName : "+ Create new") : "");
                  setBrandCreateValue("");
                  setModelCreateValue("");
                  setCategoryCreateValue(
                    product.brandName === "Others" && !CATEGORY_OPTIONS.includes(product.modelName)
                      ? product.modelName || ""
                      : "",
                  );
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

            <Inp
              label="Compatible machines (comma-sep)"
              name="compatMachineModels"
              placeholder="JUKI DDL-8700, JUKI DDL-9000"
              defaultValue={product.compat?.machineModels?.join(", ")}
            />

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

              <label className="flex items-center gap-2 text-sm pt-2">
                <input
                  type="checkbox"
                  name="hasMotor"
                  className="accent-copper"
                  defaultChecked={product.hasMotor}
                />
                Contains motor (18% GST)
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
