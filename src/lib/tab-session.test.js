import test from "node:test";
import assert from "node:assert/strict";

import {
  ensureTabSession,
  persistTabSession,
  getTabSession,
  clearTabSession,
  buildTabAuthHeaders,
} from "./tab-session.js";

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("ensureTabSession creates a unique tab-scoped session id", () => {
  const storageA = createMemoryStorage();
  const storageB = createMemoryStorage();

  const sessionA = ensureTabSession(storageA);
  const sessionB = ensureTabSession(storageB);

  assert.ok(sessionA.tabId);
  assert.ok(sessionB.tabId);
  assert.notEqual(sessionA.tabId, sessionB.tabId);
});

test("persistTabSession and getTabSession keep auth data tab-scoped", () => {
  const storage = createMemoryStorage();
  const payload = { tabId: "tab-123", accessToken: "access", refreshToken: "refresh" };

  persistTabSession(payload, storage);
  const restored = getTabSession(storage);

  assert.deepEqual(restored, payload);
});

test("buildTabAuthHeaders adds the required auth and tab identifiers", () => {
  const headers = buildTabAuthHeaders({ tabId: "tab-123", accessToken: "access-token" });

  assert.equal(headers.Authorization, "Bearer access-token");
  assert.equal(headers["X-Tab-ID"], "tab-123");
});

test("clearTabSession removes the stored session state", () => {
  const storage = createMemoryStorage();
  persistTabSession({ tabId: "tab-123", accessToken: "access" }, storage);

  clearTabSession(storage);

  assert.equal(getTabSession(storage), null);
});
