import test from "node:test";
import assert from "node:assert/strict";
import { buildGoogleAuthUrl, buildPostLoginRedirectPath } from "./google-oauth.js";

test("buildGoogleAuthUrl includes the required OAuth parameters", () => {
  const url = new URL(buildGoogleAuthUrl({
    clientId: "client-id",
    redirectUri: "https://example.com/api/auth/callback/google",
    state: "abc123",
    loginHint: "user@example.com",
  }));

  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(url.searchParams.get("redirect_uri"), "https://example.com/api/auth/callback/google");
  assert.equal(url.searchParams.get("state"), "abc123");
  assert.equal(url.searchParams.get("login_hint"), "user@example.com");
});

test("buildPostLoginRedirectPath sends admins to the admin area", () => {
  assert.equal(buildPostLoginRedirectPath("admin"), "/admin");
  assert.equal(buildPostLoginRedirectPath("superadmin"), "/admin");
  assert.equal(buildPostLoginRedirectPath("user"), "/profile");
});
