export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message, status = 500) {
  return jsonResponse({ message }, status);
}

export function badRequest(message = "Bad request") {
  return errorResponse(message, 400);
}

export function notFound(message = "Not found") {
  return errorResponse(message, 404);
}

export function parseSearchParam(request, name) {
  return new URL(request.url).searchParams.get(name) || "";
}

export function parseBoolean(value) {
  return value === "true" || value === "on";
}

export function escapeRegExp(value) {
  return (value || "").toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function parseOptionalNumber(value) {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function parseList(value) {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function safeString(value) {
  return (value || "").toString().trim();
}

export function ensureSlug(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}
