import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const COOKIE_NAME = "mw_user_id";
const COOKIE_PREFIX = "mw_user_id_";
const COOKIE_OPTIONS = "Path=/; HttpOnly; SameSite=Lax; Max-Age=604800";

function safeTabId(tabId) {
  return String(tabId || "").replace(/[^a-zA-Z0-9-_]/g, "");
}

export function getTabIdFromRequest(request) {
  const headerTabId = request.headers.get("x-mw-tab-id");
  const safeHeader = safeTabId(headerTabId);
  if (safeHeader) {
    return safeHeader;
  }
  const cookies = getCookies(request.headers.get("cookie"));
  return safeTabId(cookies["mw_tab_id"] || "");
}

/**
 * Hashes a plaintext password using crypto pbkdf2Sync.
 * 
 * @param {string} password - Plain text password.
 * @returns {string} Colon-separated salt and derived key string.
 */
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 * 
 * @param {string} password - Plain text password.
 * @param {string} storedHash - Stored colon-separated hash string.
 * @returns {boolean} True if password matches the hash.
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  const derived = pbkdf2Sync(password, salt, 310000, 32, "sha256");
  try {
    return timingSafeEqual(Buffer.from(key, "hex"), derived);
  } catch {
    return false;
  }
}

/**
 * Parses HTTP cookie header string into an key-value object map.
 * 
 * @param {string} cookieHeader - Raw Cookie header value.
 * @returns {Record<string, string>} Key-value cookie object map.
 */
export function getCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, cookiePair) => {
    const [name, ...rest] = cookiePair.trim().split("=");
    cookies[name] = rest.join("=");
    return cookies;
  }, {});
}

/**
 * Retrieves the session user ID value from request cookie.
 * 
 * @param {Request} request - Next.js Request object.
 * @returns {string} The user ID or empty string.
 */
export function getAuthCookie(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = getCookies(cookieHeader);
  const tabId = getTabIdFromRequest(request);

  if (tabId) {
    const tabCookieName = `${COOKIE_PREFIX}${tabId}`;
    return cookies[tabCookieName] || "";
  }

  return cookies[COOKIE_NAME] || "";
}

/**
 * Formats user ID value as standard HttpOnly session Set-Cookie header value.
 * 
 * @param {string} userId - User ID string.
 * @param {string} [tabId] - Optional per-tab session id.
 * @returns {string} Set-Cookie header config string.
 */
export function setAuthCookie(userId, tabId) {
  const name = tabId ? `${COOKIE_PREFIX}${safeTabId(tabId)}` : COOKIE_NAME;
  return `${name}=${encodeURIComponent(userId)}; ${COOKIE_OPTIONS}`;
}

/**
 * Formats expired HttpOnly session Set-Cookie header value for clearing cookies.
 * 
 * @returns {string} Set-Cookie header config string.
 */
export function clearAuthCookie(tabId) {
  const name = tabId ? `${COOKIE_PREFIX}${safeTabId(tabId)}` : COOKIE_NAME;
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
