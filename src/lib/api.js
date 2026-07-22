/**
 * Creates a standard JSON response with optional custom headers.
 * 
 * @param {any} data - The data to serialize to JSON.
 * @param {number} [status=200] - The HTTP status code.
 * @param {Record<string, string>} [headers={}] - Additional headers to merge.
 * @returns {Response}
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates an error response with a JSON body.
 * 
 * @param {string} message - The error message.
 * @param {number} [status=500] - The HTTP status code.
 * @returns {Response}
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ message }, status);
}

/**
 * Creates a 400 Bad Request error response.
 * 
 * @param {string} [message="Bad request"] - The error message.
 * @returns {Response}
 */
export function badRequest(message = "Bad request") {
  return errorResponse(message, 400);
}

/**
 * Creates a 404 Not Found error response.
 * 
 * @param {string} [message="Not found"] - The error message.
 * @returns {Response}
 */
export function notFound(message = "Not found") {
  return errorResponse(message, 404);
}

/**
 * Parses a query parameter from a request URL.
 * 
 * @param {Request} request - The request object.
 * @param {string} name - The query parameter name.
 * @returns {string}
 */
export function parseSearchParam(request, name) {
  const url = request?.url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new URL(url).searchParams.get(name) || "";
}

/**
 * Parses a boolean from a string value.
 * 
 * @param {string} value - The string to parse.
 * @returns {boolean}
 */
export function parseBoolean(value) {
  return value === "true" || value === "on";
}

/**
 * Escapes regex special characters.
 * 
 * @param {string} value - The string to escape.
 * @returns {string}
 */
export function escapeRegExp(value) {
  return (value || "").toString().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses a number with a fallback if invalid.
 * 
 * @param {any} value - The value to parse.
 * @param {number} [fallback=0] - The default value if parsing fails.
 * @returns {number}
 */
export function parseNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Parses an optional number, returning undefined if invalid.
 * 
 * @param {any} value - The value to parse.
 * @returns {number|undefined}
 */
export function parseOptionalNumber(value) {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Parses a comma-separated list of strings.
 * 
 * @param {any} value - The string list to parse.
 * @returns {string[]}
 */
export function parseList(value) {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Trims and converts any value to a safe string.
 * 
 * @param {any} value - The value to sanitize.
 * @returns {string}
 */
export function safeString(value) {
  return (value || "").toString().trim();
}

/**
 * Converts a string into a URL-friendly slug.
 * 
 * @param {string} value - The string to slugify.
 * @returns {string}
 */
export function ensureSlug(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}
