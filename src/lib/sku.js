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

function normalizeModelCodeForName(modelCode) {
  const value = String(modelCode || "").trim();
  if (!value) return "";
  const collapsed = collapseRepeatedNpSegments(value);
  const hasNp = /np/i.test(collapsed);
  if (!hasNp) {
    return `${collapsed[0].toUpperCase()}${collapsed.slice(1).toLowerCase()}`;
  }
  return collapsed.replace(/np/gi, "NP").replace(/^([a-z])/, (match) => match.toUpperCase());
}

function collapseRepeatedNpSegments(value) {
  return String(value || "")
    .trim()
    .replace(/(NP)+/gi, "NP");
}

function normalizeModelAndSeries(modelCode, seriesCode) {
  let modelPart = collapseRepeatedNpSegments(modelCode);
  let seriesPart = collapseRepeatedNpSegments(seriesCode);

  const upperModelPart = modelPart.toUpperCase();
  const upperSeriesPart = seriesPart.toUpperCase();

  if (upperModelPart.endsWith("NP") && upperSeriesPart.startsWith("NP")) {
    seriesPart = seriesPart.replace(/^NP(?:-)?/i, "");
    seriesPart = seriesPart.replace(/^-+/, "");
  }

  return { modelPart, seriesPart };
}

function joinModelAndSeries(modelPart, seriesPart) {
  if (!seriesPart) return modelPart;
  if (/^\d+$/.test(seriesPart)) {
    return `${modelPart}${seriesPart}`;
  }
  return `${modelPart}-${seriesPart}`;
}

export function buildSku(category, modelCode, seriesCode, iscCode, brandName = "") {
  const categoryAbbr = getCategoryAbbreviation(category);
  const { modelPart: normalizedModelPart, seriesPart: normalizedSeriesPart } = normalizeModelAndSeries(
    modelCode,
    seriesCode,
  );
  let modelPart = normalizedModelPart.toUpperCase();
  const seriesPart = normalizedSeriesPart.toUpperCase();
  const iscPart = String(iscCode || "").trim();
  const hasBrandName =
    String(brandName || "")
      .trim()
      .toLowerCase() !== "others" && String(brandName || "").trim() !== "";

  // Strip trailing series code from model to avoid duplication (e.g., PG80005NP + NP = PG80005NP)
  if (seriesPart) {
    while (modelPart.endsWith(seriesPart)) {
      modelPart = modelPart.slice(0, -seriesPart.length);
    }
  }

  if (hasBrandName) {
    // Format when brand is present: BRANDABBR-CATABBR-MODEL+SERIES(-ISC)
    const modelSeries = joinModelAndSeries(modelPart, seriesPart);
    return `${getBrandAbbreviation(brandName)}-${categoryAbbr}-${modelSeries}${iscPart ? `-${iscPart}` : ""}`;
  }

  if (iscPart) {
    return `${categoryAbbr}-${modelPart}${seriesPart}-${iscPart}`;
  }

  return `${categoryAbbr}-${modelPart}-${seriesPart}`;
}

export function buildProductName(category, modelCode, seriesCode, iscCode, brandName = "") {
  const categoryLabel = String(category || "").trim();
  const { modelPart: normalizedModelPart, seriesPart: normalizedSeriesPart } = normalizeModelAndSeries(
    modelCode,
    seriesCode,
  );
  let codeLabel = normalizeModelCodeForName(normalizedModelPart);
  const seriesPart = normalizedSeriesPart.trim();
  const iscPart = String(iscCode || "").trim();
  const hasBrandName =
    String(brandName || "")
      .trim()
      .toLowerCase() !== "others" && String(brandName || "").trim() !== "";

  // Strip trailing series code from model code to avoid duplication
  if (seriesPart) {
    const upperCode = codeLabel.toUpperCase();
    const upperSeries = seriesPart.toUpperCase();
    let cleaned = upperCode;
    while (cleaned.endsWith(upperSeries)) {
      cleaned = cleaned.slice(0, -upperSeries.length);
    }
    if (cleaned !== upperCode) {
      // Preserve original casing by trimming from the end
      codeLabel = codeLabel.slice(0, cleaned.length);
    }
  }

  if (hasBrandName) {
    const brandLabel = normalizeBrandForName(brandName);
    return `${brandLabel} ${categoryLabel} ${codeLabel}-${seriesPart}${iscPart ? ` ${iscPart}` : ""}`;
  }

  if (iscPart) {
    return `${categoryLabel} ${codeLabel}-${seriesPart} ${iscPart}`;
  }

  return `${categoryLabel} for ${codeLabel}-${seriesPart}`;
}
