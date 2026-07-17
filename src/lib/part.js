import fs from "fs";
import path from "path";
import os from "os";
import Brand from "@/src/models/Brand";
import Part from "@/src/models/Part";
import { uploadToCloudinary } from "@/src/lib/cloudinary";
import {
  ensureSlug,
  parseBoolean,
  parseList,
  parseOptionalNumber,
  safeString,
  escapeRegExp,
} from "@/src/lib/api";

const uploadsDir = path.join(os.tmpdir(), "uploads");

/**
 * Deduplicates and uploads local product image files to Cloudinary.
 * 
 * @param {File[]} files - List of uploaded files.
 * @param {string} [folder="Home/Products"] - Cloudinary destination folder path.
 * @returns {Promise<string[]>} List of uploaded secure image URLs.
 */
export async function saveUploadedImages(files, folder = "Home/Products") {
  if (!Array.isArray(files) || files.length === 0) {
    console.log("[lib/part] saveUploadedImages called with empty files");
    return [];
  }
<<<<<<< HEAD

  // Deduplicate files by name|size|lastModified to avoid double uploads
  const uniqueMap = new Map();
  for (const file of files) {
    if (!file || typeof file.size !== "number") continue;
    const key = `${file.name}|${file.size}|${file.lastModified || 0}`;
    if (!uniqueMap.has(key)) uniqueMap.set(key, file);
  }
  const uniqueFiles = Array.from(uniqueMap.values());
  console.log("[lib/part] saveUploadedImages files count:", files.length, "-> unique:", uniqueFiles.length);
=======
  console.log("[lib/part] saveUploadedImages files count:", files.length);
>>>>>>> 38a5736b5d65e154b1f4a67a80df869b0dd69600
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const uploadedUrls = [];
  for (const file of uniqueFiles) {
    if (!file || typeof file.size !== "number" || file.size === 0) {
      console.log("[lib/part] skipping invalid file", file && (file.name || typeof file));
      continue;
    }
    const tempPath = path.join(uploadsDir, `${Date.now()}-${safeString(file.name)}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(tempPath, buffer);
    const uploaded = await uploadToCloudinary(tempPath, folder, file.name);
    uploadedUrls.push(uploaded.secure_url || uploaded.url || "");
    await fs.promises.unlink(tempPath).catch(() => null);
  }
  console.log("[lib/part] uploadedUrls:", uploadedUrls.length, uploadedUrls);
  return uploadedUrls;
}

/**
 * Ensures brand and model database records exist, generating slugs if necessary.
 * 
 * @param {object} params
 * @param {string} params.brandName - Name of the brand.
 * @param {string} params.modelName - Name of the model.
 * @param {boolean} params.isCategoryMode - Whether this is a category route.
 * @returns {Promise<{ brandName: string, brandSlug: string, modelName: string, modelSlug: string }>}
 */
export async function ensureBrandAndModel({ brandName, modelName, isCategoryMode }) {
  const normalizedBrandName = safeString(brandName);
  const normalizedModelName = safeString(modelName);
  if (!normalizedBrandName && !normalizedModelName) {
    return { brandName: "", brandSlug: "", modelName: "", modelSlug: "" };
  }

  if (!normalizedBrandName && !isCategoryMode) {
    throw new Error("Brand name is required when creating a branded product.");
  }

  const resolvedBrandName = normalizedBrandName || "";
  const resolvedModelName = normalizedModelName || "";
  let brand = null;
  if (resolvedBrandName) {
    brand =
      (await Brand.findOne({
        name: new RegExp(`^${resolvedBrandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      })) ||
      (await Brand.create({
        slug: ensureSlug(resolvedBrandName),
        name: resolvedBrandName,
        isBrand: !isCategoryMode,
        models: [],
      }));
  }

  if (resolvedModelName) {
    const hasModel = brand.models?.some(
      (model) => model.name.toLowerCase() === resolvedModelName.toLowerCase(),
    );
    if (!hasModel) {
      brand.models = brand.models || [];
      brand.models.push({
        slug: ensureSlug(resolvedModelName),
        name: resolvedModelName,
        partsCount: 0,
      });
      await brand.save();
    }
  }

  return {
    brandName: brand ? brand.name : "",
    brandSlug: brand ? brand.slug : "",
    modelName: resolvedModelName,
    modelSlug: ensureSlug(resolvedModelName),
  };
}

<<<<<<< HEAD
/**
 * Builds a MongoDB query filter object from the parsed search/category params.
 * 
 * @param {object} params
 * @param {string} params.q - Search query string.
 * @param {string} params.brand - Brand slug.
 * @param {string} params.model - Model slug.
 * @param {string} params.category - Category slug.
 * @param {string} params.skus - Comma-separated list of SKUs.
 * @param {string} params.stitchType - Stitch type.
 * @param {string} params.minPrice - Minimum price.
 * @param {string} params.maxPrice - Maximum price.
 * @param {string} params.inStockOnly - Filter in-stock only.
 * @param {string} params.onSale - Filter on-sale items.
 * @param {boolean} params.nameOnly - Search only name.
 * @returns {Record<string, any>} MongoDB query filter.
 */
export function buildPartFilter({
  q,
  brand,
  model,
  category,
  skus,
=======
export function buildPartFilter({
  q,
  brand,
  category,
>>>>>>> 38a5736b5d65e154b1f4a67a80df869b0dd69600
  stitchType,
  minPrice,
  maxPrice,
  inStockOnly,
  onSale,
  nameOnly,
}) {
  const filter = {};
  if (q) {
    const escapedSearch = escapeRegExp(q);
    const searchRegex = new RegExp(escapedSearch, "i");
    filter.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { id1: searchRegex },
      { id2: searchRegex },
      { diagramNumber: searchRegex },
      { altPartNumbers: searchRegex },
    ];

    if (!nameOnly) {
      filter.$or.push(
        { description: searchRegex },
        { brandName: searchRegex },
        { modelName: searchRegex },
        { brandSlug: searchRegex },
        { modelSlug: searchRegex },
        { "compat.machineModels": searchRegex },
        { "compat.stitchType": searchRegex },
      );
    }
  }

  if (brand) {
    filter.brandSlug = { $in: parseList(brand) };
  }

  // Filter by model slug (used on /brand/[brand]/[model] pages)
  if (model) {
    filter.modelSlug = { $in: parseList(model) };
  }

  // Filter by category root slug (used on /categories pages, not brand-model pages)
  if (category) {
    filter.categoryRootSlug = { $in: parseList(category) };
  }

  // Filter by list of specific SKUs (used to fetch only cart items)
  if (skus) {
    filter.sku = { $in: parseList(skus) };
  }

  if (stitchType) {
    filter["compat.stitchType"] = { $in: parseList(stitchType) };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (inStockOnly === "true") {
    filter.stock = { $gt: 0 };
  }

  if (onSale === "true") {
    filter.compareAt = { $exists: true, $ne: null };
    filter.$expr = { $gt: ["$compareAt", "$price"] };
  }

  return filter;
}

/**
 * Builds standard MongoDB sorting options based on user dropdown selection.
 * 
 * @param {string} sort - Sort option value.
 * @returns {Record<string, number>} MongoDB sort criteria.
 */
export function buildSortOptions(sort) {
  if (sort === "price: low to high" || sort === "price_asc") return { price: 1 };
  if (sort === "price: high to low" || sort === "price_desc") return { price: -1 };
  if (sort === "Newest" || sort === "newest") return { createdAt: -1 };
  return { rating: -1 };
}

/**
 * Parses and sanitizes fields from multi-part form data request.
 * 
 * @param {FormData} formData - The request multi-part form data.
 * @returns {Record<string, any>} Cleaned values ready for schema mapping.
 */
export function parsePartFormData(formData) {
  const get = (name) => safeString(formData.get(name));
  return {
    sku: get("sku"),
    name: get("name"),
    description: get("description"),
    diagramNumber: get("diagramNumber"),
    id1: get("id1"),
    id2: get("id2"),
    altPartNumbers: parseList(get("altPartNumbers")),
    compatMachineModels: parseList(get("compatMachineModels")),
    compatNeedleSystem: get("compatNeedleSystem"),
    compatThreadType: get("compatThreadType"),
    compatStitchType: get("compatStitchType"),
    specsMaterial: get("specsMaterial"),
    specsWeight: get("specsWeight"),
    maintenanceReplacementHours: parseOptionalNumber(get("maintenanceReplacementHours")),
    price: parseOptionalNumber(get("price")),
    compareAt: parseOptionalNumber(get("compareAt")),
    stock: parseOptionalNumber(get("stock")),
    stockAlert: parseOptionalNumber(get("stockAlert")),
    hasMotor: parseBoolean(get("hasMotor")),
    brandName: get("brandName"),
    modelName: get("modelName"),
    categoryRoot: get("categoryRoot"),
    mode: get("mode"),
    taxonomy: {
      department: get("taxonomy.department"),
      category: get("taxonomy.category"),
      subCategory: get("taxonomy.subCategory"),
      productType: get("taxonomy.productType"),
      family: get("taxonomy.family"),
    },
    manufacturer: get("manufacturer"),
    manufacturerCountry: get("manufacturerCountry"),
    status: get("status"),
    keywords: parseList(get("keywords")),
    aliases: parseList(get("aliases")),
    compatibleBrands: (() => {
      try {
        const raw = formData.get("compatibleBrands");
        return raw ? JSON.parse(Array.isArray(raw) ? raw[0] : raw) : [];
      } catch (e) {
        return [];
      }
    })(),
    linkedSeries: (() => {
      try {
        const raw = formData.get("linkedSeries");
        return raw ? JSON.parse(Array.isArray(raw) ? raw[0] : raw) : { series: "", products: [] };
      } catch (e) {
        return { series: "", products: [] };
      }
    })(),
  };
}

/**
 * Maps the parsed values and image URLs to the Part Mongoose Schema payload.
 * 
 * @param {Record<string, any>} values - Sanitized form values.
 * @param {string[]} uploadedUrls - Uploaded image URLs.
 * @param {object} brandData - Resolved brand/model slug and names data.
 * @returns {Record<string, any>} Payload matching mongoose schema.
 */
export function createPartPayload(values, uploadedUrls, brandData) {
  return {
    sku: values.sku,
    id1: values.id1,
    id2: values.id2,
    name: values.name,
    description: values.description,
    diagramNumber: values.diagramNumber,
    altPartNumbers: values.altPartNumbers,
    compat: {
      machineModels: values.compatMachineModels,
      needleSystem: values.compatNeedleSystem,
      threadType: values.compatThreadType,
      stitchType: values.compatStitchType ? [values.compatStitchType] : [],
    },
    specs: {
      material: values.specsMaterial,
      weight: values.specsWeight,
    },
    maintenance: {
      replacementInterval_hours: values.maintenanceReplacementHours,
    },
    price: values.price || 0,
    compareAt: values.compareAt,
    stock: values.stock || 0,
    stockAlert: values.stockAlert || 0,
    hasMotor: values.hasMotor,
    brandName: brandData.brandName || "",
    brandSlug: brandData.brandSlug || ensureSlug(brandData.brandName),
    modelName: brandData.modelName || "",
    modelSlug: brandData.modelSlug || ensureSlug(brandData.modelName),
    categoryRoot: values.categoryRoot || "",
    categoryRootSlug: values.categoryRoot ? ensureSlug(values.categoryRoot) : "",
    taxonomy: values.taxonomy || {},
    manufacturer: values.manufacturer || "",
    manufacturerCountry: values.manufacturerCountry || "",
    status: values.status || "Active",
    keywords: values.keywords || [],
    aliases: values.aliases || [],
    compatibleBrands: values.compatibleBrands || [],
    linkedSeries: values.linkedSeries || { series: "", products: [] },
    images: uploadedUrls,
    rating: 0,
    reviews: 0,
  };
}

<<<<<<< HEAD
/**
 * Generates patch updates for an existing part structure from incoming form inputs.
 * 
 * @param {object} existingPart - The current Mongo DB document of the part.
 * @param {FormData} formData - Multi-part form request content.
 * @param {string[]} uploadedUrls - Newly uploaded image URLs.
 * @param {string[]} deletedImageUrls - Image URLs to prune from the gallery.
 * @param {object} brandData - Resolved brand/model slug and names data.
 * @returns {Record<string, any>} Cleaned update patch document.
 */
=======
>>>>>>> 38a5736b5d65e154b1f4a67a80df869b0dd69600
export function buildPartUpdateData(
  existingPart,
  formData,
  uploadedUrls,
  deletedImageUrls,
  brandData = {},
) {
  const values = parsePartFormData(formData);
  const imageList = existingPart.images?.filter((img) => !deletedImageUrls.includes(img)) || [];

  return {
    sku: values.sku || existingPart.sku,
    name: values.name || existingPart.name,
<<<<<<< HEAD
    description: formData.has("description") ? values.description : existingPart.description,
    diagramNumber: formData.has("diagramNumber") ? values.diagramNumber : existingPart.diagramNumber,
    id1: formData.has("id1") ? values.id1 : existingPart.id1,
    id2: formData.has("id2") ? values.id2 : existingPart.id2,
    altPartNumbers: formData.has("altPartNumbers") ? values.altPartNumbers : existingPart.altPartNumbers,
    compat: {
      machineModels: formData.has("compatMachineModels") ? values.compatMachineModels : existingPart.compat.machineModels,
      needleSystem: formData.has("compatNeedleSystem") ? values.compatNeedleSystem : existingPart.compat.needleSystem,
      threadType: formData.has("compatThreadType") ? values.compatThreadType : existingPart.compat.threadType,
      stitchType: formData.has("compatStitchType")
        ? (values.compatStitchType ? [values.compatStitchType] : [])
=======
    description: values.description || existingPart.description,
    diagramNumber: values.diagramNumber || existingPart.diagramNumber,
    id1: values.id1 || existingPart.id1,
    id2: values.id2 || existingPart.id2,
    altPartNumbers: values.altPartNumbers.length
      ? values.altPartNumbers
      : existingPart.altPartNumbers,
    compat: {
      machineModels: values.compatMachineModels.length
        ? values.compatMachineModels
        : existingPart.compat.machineModels,
      needleSystem: values.compatNeedleSystem || existingPart.compat.needleSystem,
      threadType: values.compatThreadType || existingPart.compat.threadType,
      stitchType: values.compatStitchType
        ? [values.compatStitchType]
>>>>>>> 38a5736b5d65e154b1f4a67a80df869b0dd69600
        : existingPart.compat.stitchType,
    },
    specs: {
      material: formData.has("specsMaterial") ? values.specsMaterial : existingPart.specs.material,
      weight: formData.has("specsWeight") ? values.specsWeight : existingPart.specs.weight,
    },
    maintenance: {
      replacementInterval_hours: formData.has("maintenanceReplacementHours")
        ? (values.maintenanceReplacementHours ?? null)
        : existingPart.maintenance.replacementInterval_hours,
    },
    price: formData.has("price") ? (values.price ?? 0) : existingPart.price,
    compareAt: formData.has("compareAt") ? (values.compareAt ?? null) : existingPart.compareAt,
    stock: formData.has("stock") ? (values.stock ?? 0) : existingPart.stock,
    stockAlert: formData.has("stockAlert") ? (values.stockAlert ?? 0) : existingPart.stockAlert,
    hasMotor: formData.has("hasMotor") ? values.hasMotor : existingPart.hasMotor,
    brandName: brandData.brandName !== undefined ? brandData.brandName : existingPart.brandName,
    brandSlug: brandData.brandSlug !== undefined ? brandData.brandSlug : existingPart.brandSlug,
    modelName: brandData.modelName !== undefined ? brandData.modelName : existingPart.modelName,
    modelSlug: brandData.modelSlug !== undefined ? brandData.modelSlug : existingPart.modelSlug,
    categoryRoot: formData.has("categoryRoot") ? values.categoryRoot : existingPart.categoryRoot,
    categoryRootSlug: formData.has("categoryRoot")
      ? (values.categoryRoot && values.categoryRoot.trim() ? ensureSlug(values.categoryRoot) : "")
      : existingPart.categoryRootSlug,
    taxonomy: formData.has("taxonomy.category") || formData.has("taxonomy.department") ? values.taxonomy : existingPart.taxonomy,
    manufacturer: formData.has("manufacturer") ? values.manufacturer : existingPart.manufacturer,
    manufacturerCountry: formData.has("manufacturerCountry") ? values.manufacturerCountry : existingPart.manufacturerCountry,
    status: formData.has("status") ? values.status : existingPart.status,
    keywords: formData.has("keywords") ? values.keywords : existingPart.keywords,
    aliases: formData.has("aliases") ? values.aliases : existingPart.aliases,
    linkedSeries: formData.has("linkedSeries") ? (values.linkedSeries || { series: "", products: [] }) : (existingPart.linkedSeries || { series: "", products: [] }),
    images: [...imageList, ...uploadedUrls],
  };
}

/**
 * Synchronizes linkedSeries values across all parts in a series.
 * 
 * @param {string} targetSku - The SKU of the main product being created/updated.
 * @param {object|null} oldLinkedSeries - The previous linkedSeries object of the product.
 * @param {object|null} newLinkedSeries - The new linkedSeries object of the product.
 */
export async function syncPartSeries(targetSku, oldLinkedSeries, newLinkedSeries) {
  const oldSeriesCode = oldLinkedSeries?.series || "";
  const oldSkus = oldLinkedSeries?.products || [];

  const newSeriesCode = newLinkedSeries?.series || "";
  const newSkus = newLinkedSeries?.products || [];

  // 1. If a new series is defined, sync it across all products in the new list
  if (newSeriesCode && newSkus.length > 0) {
    const updatedNewSkus = [...new Set([...newSkus, targetSku])];

    // Check if any of these products were in a different series previously,
    // and pull them from their old series.
    const partsEnteringNewSeries = await Part.find({ sku: { $in: updatedNewSkus } });

    for (const part of partsEnteringNewSeries) {
      const currentSeries = part.linkedSeries?.series || "";
      const currentProducts = part.linkedSeries?.products || [];

      if (currentSeries && currentSeries !== newSeriesCode) {
        const siblingSkus = currentProducts.filter((sku) => sku !== part.sku);
        if (siblingSkus.length > 0) {
          await Part.updateMany(
            { sku: { $in: siblingSkus } },
            { $pull: { "linkedSeries.products": part.sku } }
          );

          // Clean up sibling parts left alone
          const siblings = await Part.find({ sku: { $in: siblingSkus } });
          for (const sib of siblings) {
            if ((sib.linkedSeries?.products || []).length <= 1) {
              sib.linkedSeries = { series: "", products: [] };
              await sib.save();
            }
          }
        }
      }
    }

    const cleanedNewSeries = {
      series: newSeriesCode,
      products: updatedNewSkus,
    };

    await Part.updateMany(
      { sku: { $in: updatedNewSkus } },
      { $set: { linkedSeries: cleanedNewSeries } }
    );
  }

  // 2. Identify SKUs that were in the old series but are not in the new series
  const removedSkus = oldSkus.filter((sku) => sku !== targetSku && !newSkus.includes(sku));
  if (removedSkus.length > 0) {
    await Part.updateMany(
      { sku: { $in: removedSkus } },
      { $pull: { "linkedSeries.products": targetSku } }
    );

    // Clean up sibling parts left alone
    const remainingParts = await Part.find({ sku: { $in: removedSkus } });
    for (const part of remainingParts) {
      if ((part.linkedSeries?.products || []).length <= 1) {
        part.linkedSeries = { series: "", products: [] };
        await part.save();
      }
    }
  }

  // 3. Clean up the target part itself if it has no series or is alone in it
  if (!newSeriesCode || newSkus.length <= 1) {
    await Part.updateOne(
      { sku: targetSku },
      { $set: { linkedSeries: { series: "", products: [] } } }
    );
  }
}
