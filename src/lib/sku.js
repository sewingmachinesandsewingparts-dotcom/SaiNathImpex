export function buildSkuFromName(name, fallback = "PART") {
  const raw = String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return raw ? `${fallback}-${raw}` : fallback;
}

function getAbbreviation(value, maxLetters) {
  const normalized = String(value || "").trim();
  const words = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase());

  if (words.length === 0) return "";
  if (words.length === 1) return normalized.slice(0, maxLetters).toUpperCase();
  return words.slice(0, Math.min(words.length, maxLetters)).join("");
}

const CATEGORY_ABBREVIATIONS = {
  "eye guard": "EYE",
  puller: "PUL",
  "puller case": "PUC",
  "puller case suit": "PCS",
  bobbin: "BOB",
  "bobbin case": "BCA",
  "bobbin case suit": "BCS",
};

function getCategoryAbbreviation(category) {
  const normalized = String(category || "").trim().toLowerCase();
  if (CATEGORY_ABBREVIATIONS[normalized]) {
    return CATEGORY_ABBREVIATIONS[normalized];
  }
  return getAbbreviation(category, 3);
}

function getBrandAbbreviation(brand) {
  return getAbbreviation(brand, 3);
}

function normalizeBrandForName(brand) {
  if (!brand) return "";
  const value = brand.trim().toLowerCase();
  return value.length === 1 ? value.toUpperCase() : `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function buildSku(category, modelCode, seriesCode, iscCode, brandName = "") {
  const categoryAbbr = getCategoryAbbreviation(category);
  const modelPart = String(modelCode || "")
    .trim()
    .toUpperCase();
  const seriesPart = String(seriesCode || "").trim();
  const iscPart = String(iscCode || "").trim();
  const hasBrandName =
    String(brandName || "")
      .trim()
      .toLowerCase() !== "others" && String(brandName || "").trim() !== "";

  if (hasBrandName) {
    // Format when brand is present: BRANDABBR-CATABBR-MODEL+SERIES(-ISC)
    const modelSeries = `${modelPart}${seriesPart}`;
    return `${getBrandAbbreviation(brandName)}-${categoryAbbr}-${modelSeries}${iscPart ? `-${iscPart}` : ""}`;
  }

  if (iscPart) {
    return `${categoryAbbr}-${modelPart}${seriesPart}-${iscPart}`;
  }

  return `${categoryAbbr}-${modelPart}-${seriesPart}`;
}

export function buildProductName(category, modelCode, seriesCode, iscCode, brandName = "") {
  const categoryLabel = String(category || "").trim();
  const codeLabel = normalizeBrandForName(modelCode);
  const seriesPart = String(seriesCode || "").trim();
  const iscPart = String(iscCode || "").trim();
  const hasBrandName =
    String(brandName || "")
      .trim()
      .toLowerCase() !== "others" && String(brandName || "").trim() !== "";

  if (hasBrandName) {
    const brandLabel = normalizeBrandForName(brandName);
    return `${brandLabel} ${categoryLabel} ${codeLabel}-${seriesPart}${iscPart ? ` ${iscPart}` : ""}`;
  }

  if (iscPart) {
    return `${categoryLabel} ${codeLabel}-${seriesPart} ${iscPart}`;
  }

  return `${categoryLabel} for ${codeLabel}-${seriesPart}`;
}
