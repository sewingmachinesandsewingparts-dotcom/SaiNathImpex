export function buildPreviewLabels(part, limit = 3) {
  const labels = [
    part?.linkedSeries?.series || part?.series?.code || part?.id1,
    part?.id1,
    part?.id2,
    part?.OEM,
    part?.sku,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  const seen = new Set();
  return labels.filter((label) => {
    const key = label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
