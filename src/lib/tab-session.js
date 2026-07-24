const TAB_SESSION_KEY = "tab-session";

function getStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }

  return null;
}

function readSession(storage) {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(TAB_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(storage, value) {
  if (!storage) {
    return;
  }

  storage.setItem(TAB_SESSION_KEY, JSON.stringify(value));
}

function removeSession(storage) {
  if (!storage) {
    return;
  }

  storage.removeItem(TAB_SESSION_KEY);
}

export function ensureTabSession(storage = null) {
  const targetStorage = getStorage(storage);
  const existing = readSession(targetStorage);

  if (existing && existing.tabId) {
    return existing;
  }

  const tabId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const nextSession = { tabId };
  writeSession(targetStorage, nextSession);
  return nextSession;
}

export function persistTabSession(payload, storage = null) {
  const targetStorage = getStorage(storage);
  const current = ensureTabSession(targetStorage);
  const nextSession = {
    ...current,
    ...payload,
    tabId: payload?.tabId || current.tabId,
  };

  writeSession(targetStorage, nextSession);
  return nextSession;
}

export function getTabSession(storage = null) {
  const targetStorage = getStorage(storage);
  const current = readSession(targetStorage);
  return current && current.tabId ? current : null;
}

export function clearTabSession(storage = null) {
  removeSession(getStorage(storage));
}

export function buildTabAuthHeaders(session = null, extraHeaders = {}) {
  const tabId = session?.tabId || "";
  const accessToken = session?.accessToken || "";

  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(tabId ? { "X-Tab-ID": tabId } : {}),
    ...extraHeaders,
  };
}

export function buildDeviceFingerprint() {
  if (typeof window === "undefined") {
    return "server";
  }

  const screen = window.screen
    ? `${window.screen.width}x${window.screen.height}`
    : "";
  const navigatorInfo = [window.navigator.userAgent, window.navigator.language, window.navigator.platform, screen]
    .filter(Boolean)
    .join("|");

  return navigatorInfo || "unknown";
}
