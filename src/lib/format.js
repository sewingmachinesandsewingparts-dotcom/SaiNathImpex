export function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Returns the canonical URL for a part.
 * Prefers /brand/[brandSlug]/[MCG]/[OEM] when all three fields are present;
 * falls back to /part/[sku] for legacy parts without MCG / OEM data.
 *
 * @param {object} part - A part document or lean object.
 * @returns {string} URL string.
 */
export function partHref(part) {
  if (part?.brandSlug && part?.MCG && part?.OEM) {
    return `/brand/${part.brandSlug}/${encodeURIComponent(part.MCG)}/${encodeURIComponent(part.OEM)}`;
  }
  return `/part/${part?.sku ?? ""}`;
}
