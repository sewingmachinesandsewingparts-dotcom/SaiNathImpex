import fs from "fs";
import path from "path";
import Brand from "@/src/models/Brand";
import { uploadToCloudinary } from "@/src/lib/cloudinary";
import {
  ensureSlug,
  parseBoolean,
  parseList,
  parseOptionalNumber,
  safeString,
  escapeRegExp,
} from "@/src/lib/api";

const uploadsDir = path.resolve("uploads");

export async function saveUploadedImages(files, folder = "Home/Products") {
  if (!Array.isArray(files) || files.length === 0) {
    console.log('[lib/part] saveUploadedImages called with empty files');
    return [];
  }
  console.log('[lib/part] saveUploadedImages files count:', files.length);
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const uploadedUrls = [];
  for (const file of files) {
    if (!file || typeof file.size !== "number" || file.size === 0) {
      console.log('[lib/part] skipping invalid file', file && (file.name || typeof file));
      continue;
    }
    const tempPath = path.join(uploadsDir, `${Date.now()}-${safeString(file.name)}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(tempPath, buffer);
    const uploaded = await uploadToCloudinary(tempPath, folder, file.name);
    uploadedUrls.push(uploaded.secure_url || uploaded.url || "");
    await fs.promises.unlink(tempPath).catch(() => null);
  }
  console.log('[lib/part] uploadedUrls:', uploadedUrls.length, uploadedUrls);
  return uploadedUrls;
}

export async function ensureBrandAndModel({ brandName, modelName, isCategoryMode }) {
  const normalizedBrandName = safeString(brandName);
  const normalizedModelName = safeString(modelName);
  if (!normalizedBrandName && !normalizedModelName) {
    return { brandName: "", brandSlug: "", modelName: "", modelSlug: "" };
  }

  if (!normalizedBrandName && !isCategoryMode) {
    throw new Error("Brand name is required when creating a branded product.");
  }

  const resolvedBrandName = normalizedBrandName || (isCategoryMode ? "Others" : "");
  const resolvedModelName = normalizedModelName || "";
  const brand =
    (await Brand.findOne({
      name: new RegExp(`^${resolvedBrandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    })) ||
    (await Brand.create({
      slug: ensureSlug(resolvedBrandName || "others"),
      name: resolvedBrandName || "Others",
      isBrand: !isCategoryMode,
      models: [],
    }));

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
    brandName: brand.name,
    brandSlug: brand.slug,
    modelName: resolvedModelName,
    modelSlug: ensureSlug(resolvedModelName),
  };
}

export function buildPartFilter({ q, brand, category, stitchType, minPrice, maxPrice, inStockOnly, onSale, nameOnly }) {
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

  if (category) {
    filter.modelSlug = { $in: parseList(category) };
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

export function buildSortOptions(sort) {
  if (sort === "price: low to high" || sort === "price_asc") return { price: 1 };
  if (sort === "price: high to low" || sort === "price_desc") return { price: -1 };
  if (sort === "Newest" || sort === "newest") return { createdAt: -1 };
  return { rating: -1 };
}

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
    hasMotor: parseBoolean(get("hasMotor")),
    brandName: get("brandName"),
    modelName: get("modelName"),
    mode: get("mode"),
  };
}

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
    hasMotor: values.hasMotor,
    brandName: brandData.brandName || "",
    brandSlug: brandData.brandSlug || ensureSlug(brandData.brandName),
    modelName: brandData.modelName || "",
    modelSlug: brandData.modelSlug || ensureSlug(brandData.modelName),
    images: uploadedUrls,
    rating: 0,
    reviews: 0,
  };
}

export function buildPartUpdateData(existingPart, formData, uploadedUrls, deletedImageUrls, brandData = {}) {
  const values = parsePartFormData(formData);
  const imageList = existingPart.images?.filter((img) => !deletedImageUrls.includes(img)) || [];

  return {
    name: values.name || existingPart.name,
    description: values.description || existingPart.description,
    diagramNumber: values.diagramNumber || existingPart.diagramNumber,
    id1: values.id1 || existingPart.id1,
    id2: values.id2 || existingPart.id2,
    altPartNumbers: values.altPartNumbers.length ? values.altPartNumbers : existingPart.altPartNumbers,
    compat: {
      machineModels: values.compatMachineModels.length ? values.compatMachineModels : existingPart.compat.machineModels,
      needleSystem: values.compatNeedleSystem || existingPart.compat.needleSystem,
      threadType: values.compatThreadType || existingPart.compat.threadType,
      stitchType: values.compatStitchType ? [values.compatStitchType] : existingPart.compat.stitchType,
    },
    specs: {
      material: values.specsMaterial || existingPart.specs.material,
      weight: values.specsWeight || existingPart.specs.weight,
    },
    maintenance: {
      replacementInterval_hours:
        typeof values.maintenanceReplacementHours === "number"
          ? values.maintenanceReplacementHours
          : existingPart.maintenance.replacementInterval_hours,
    },
    price: typeof values.price === "number" ? values.price : existingPart.price,
    compareAt: typeof values.compareAt === "number" ? values.compareAt : existingPart.compareAt,
    stock: typeof values.stock === "number" ? values.stock : existingPart.stock,
    hasMotor: typeof values.hasMotor === "boolean" ? values.hasMotor : existingPart.hasMotor,
    brandName: brandData.brandName || existingPart.brandName,
    brandSlug: brandData.brandSlug || existingPart.brandSlug,
    modelName: brandData.modelName || existingPart.modelName,
    modelSlug: brandData.modelSlug || existingPart.modelSlug,
    images: [...imageList, ...uploadedUrls],
  };
}
