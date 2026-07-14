import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const COOKIE_NAME = "mw_user_id";
const COOKIE_OPTIONS = "Path=/; HttpOnly; SameSite=Lax; Max-Age=604800";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `${salt}:${derived}`;
}

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

export function getCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((cookies, cookiePair) => {
    const [name, ...rest] = cookiePair.trim().split("=");
    cookies[name] = rest.join("=");
    return cookies;
  }, {});
}

export function getAuthCookie(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = getCookies(cookieHeader);
  return cookies[COOKIE_NAME] || "";
}

export function setAuthCookie(userId) {
  return `${COOKIE_NAME}=${encodeURIComponent(userId)}; ${COOKIE_OPTIONS}`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
