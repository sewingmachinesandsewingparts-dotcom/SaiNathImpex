import test from "node:test";
import assert from "node:assert/strict";

import { createSessionTokenPair, verifyJwt } from "./session-auth.js";

test("createSessionTokenPair preserves the session id in access and refresh tokens", () => {
  const result = createSessionTokenPair({
    userId: "USR001",
    sessionId: "SES123",
    tabId: "tab-123",
  });

  const accessPayload = verifyJwt(result.accessToken);
  const refreshPayload = verifyJwt(result.refreshToken);

  assert.equal(accessPayload.sessionId, "SES123");
  assert.equal(refreshPayload.sessionId, "SES123");
  assert.equal(accessPayload.tabId, "tab-123");
  assert.equal(refreshPayload.tabId, "tab-123");
});
