import { createHash, createHmac } from "crypto";

let connectMongo = null;
let User = null;
let UserSession = null;
let jsonResponse = null;

async function loadDependencies() {
  if (!connectMongo) {
    ({ default: connectMongo } = await import("./mongo.js"));
  }
  if (!User) {
    ({ default: User } = await import("../models/User.js"));
  }
  if (!UserSession) {
    ({ default: UserSession } = await import("../models/UserSession.js"));
  }
  if (!jsonResponse) {
    ({ jsonResponse } = await import("./api.js"));
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";
const ACCESS_TOKEN_TTL = 15 * 60;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const rateLimitStore = new Map();

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export function signJwt(payload, expiresInSeconds) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: getCurrentTimestamp(),
      exp: getCurrentTimestamp() + expiresInSeconds,
    }),
  );
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${header}.${body}.${signature}`;
}

export function createSessionTokenPair({ userId, sessionId, tabId }) {
  return {
    accessToken: signJwt({ sub: userId, sessionId, tabId, type: "access" }, ACCESS_TOKEN_TTL),
    refreshToken: signJwt({ sub: userId, sessionId, tabId, type: "refresh" }, REFRESH_TOKEN_TTL),
  };
}

export function verifyJwt(token) {
  if (!token) {
    return null;
  }

  const parts = String(token).split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (expectedSignature !== signature) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }

  if (!payload.exp || payload.exp <= getCurrentTimestamp()) {
    return null;
  }

  return payload;
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
}

export function applyLoginRateLimit(request) {
  const key = getClientIp(request);
  const now = Date.now();
  const previous = rateLimitStore.get(key);

  if (previous && previous.resetAt > now) {
    if (previous.count >= RATE_LIMIT_MAX_ATTEMPTS) {
      throw new Error("Too many login attempts. Please wait a while before trying again.");
    }
    previous.count += 1;
    rateLimitStore.set(key, previous);
    return;
  }

  rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
}

function buildUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image || "",
    role: user.role,
    status: user.status,
    permissions: user.permissions || [],
  };
}

export async function createSessionRecord({ user, tabId, deviceFingerprint, accessToken, refreshToken }) {
  await loadDependencies();
  await connectMongo();
  const sessionId = `SES${Date.now()}${Math.random().toString(16).slice(2, 8)}`;
  const now = new Date();

  const session = await UserSession.create({
    id: sessionId,
    user_id: user.id,
    tab_id: tabId,
    access_token_hash: hashToken(accessToken),
    refresh_token_hash: hashToken(refreshToken),
    device_fingerprint: deviceFingerprint || "unknown",
    created_at: now,
    last_activity: now,
    expires_at: new Date(now.getTime() + ACCESS_TOKEN_TTL * 1000),
    status: "active",
  });

  return session;
}

export async function rotateSessionTokens(session) {
  await loadDependencies();
  const newAccessToken = signJwt({ sub: session.user_id, sessionId: session.id, tabId: session.tab_id, type: "access" }, ACCESS_TOKEN_TTL);
  const newRefreshToken = signJwt({ sub: session.user_id, sessionId: session.id, tabId: session.tab_id, type: "refresh" }, REFRESH_TOKEN_TTL);

  session.access_token_hash = hashToken(newAccessToken);
  session.refresh_token_hash = hashToken(newRefreshToken);
  session.last_activity = new Date();
  session.expires_at = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);
  await session.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function deactivateSession(session) {
  if (!session) {
    return;
  }

  session.status = "inactive";
  session.expires_at = new Date();
  session.last_activity = new Date();
  await session.save();
}

export async function validateSessionToken({ token, expectedType = "access", tabId = "", deviceFingerprint = "" }) {
  await loadDependencies();
  if (!token) {
    throw new Error("Authentication required.");
  }

  const payload = verifyJwt(token);
  if (!payload || payload.type !== expectedType) {
    throw new Error("Invalid token.");
  }

  await connectMongo();
  const session = await UserSession.findOne({ id: payload.sessionId, user_id: payload.sub, status: "active" });
  if (!session) {
    throw new Error("Session not found.");
  }

  if (tabId && session.tab_id && session.tab_id !== tabId) {
    throw new Error("Tab mismatch.");
  }

  if (deviceFingerprint && session.device_fingerprint && session.device_fingerprint !== deviceFingerprint) {
    throw new Error("Device fingerprint mismatch.");
  }

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    session.status = "expired";
    await session.save();
    throw new Error("Session expired.");
  }

  const tokenHash = hashToken(token);
  const expectedHash = expectedType === "access" ? session.access_token_hash : session.refresh_token_hash;
  if (expectedHash !== tokenHash) {
    throw new Error("Token mismatch.");
  }

  session.last_activity = new Date();
  await session.save();

  const user = await User.findOne({ id: payload.sub });
  if (!user || user.status === "blocked") {
    throw new Error("User session is no longer available.");
  }

  return { user, session, payload };
}

export async function authenticateSessionRequest(request, { expectedType = "access" } = {}) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const tabId = request.headers.get("x-tab-id") || "";
  const deviceFingerprint = request.headers.get("x-device-fingerprint") || "";

  return validateSessionToken({ token, expectedType, tabId, deviceFingerprint });
}

export function serializeUser(user) {
  return buildUserResponse(user);
}

export function createAuthResponsePayload(user, session, accessToken, refreshToken) {
  return {
    user: serializeUser(user),
    accessToken,
    refreshToken,
    tabId: session.tab_id,
  };
}

export async function createJsonResponse(payload, status = 200) {
  await loadDependencies();
  return jsonResponse(payload, status);
}
