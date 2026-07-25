export function resolveIdentifierFields(existingPart = {}, values = {}, formData = {}) {
  const existingSeries = existingPart?.linkedSeries?.series || existingPart?.series?.code || existingPart?.MCG || existingPart?.id1 || "";
  const existingId1 = existingPart?.id1 || existingPart?.MCG || "";
  const existingId2 = existingPart?.id2 || existingPart?.OEM || "";

  const submittedSeries = String(values?.series || values?.linkedSeries?.series || "").trim();
  const submittedId1 = String(values?.id1 || values?.MCG || "").trim();
  const submittedId2 = String(values?.id2 || values?.OEM || "").trim();

  const hasSeriesField = formData?.has?.("series") || formData?.has?.("linkedSeries") || formData?.has?.("id1") || formData?.has?.("MCG");
  const hasId1Field = formData?.has?.("id1") || formData?.has?.("MCG");
  const hasId2Field = formData?.has?.("id2") || formData?.has?.("OEM");

  const resolvedSeries = hasSeriesField ? (submittedSeries || existingSeries) : existingSeries;
  const resolvedId1 = hasId1Field ? (submittedId1 || existingId1) : existingId1;
  const resolvedId2 = hasId2Field ? (submittedId2 || existingId2) : existingId2;

  return {
    series: resolvedSeries,
    id1: resolvedId1,
    id2: resolvedId2,
    MCG: resolvedSeries || resolvedId1 || "",
    OEM: resolvedId2 || "",
  };
}
