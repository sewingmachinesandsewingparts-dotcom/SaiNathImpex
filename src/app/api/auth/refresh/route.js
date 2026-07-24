import { jsonResponse, badRequest } from "@/src/lib/api";
import { rotateSessionTokens, validateSessionToken, createAuthResponsePayload } from "@/src/lib/session-auth";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.refreshToken || "";
    const tabId = body.tabId || request.headers.get("x-tab-id") || "";
    const deviceFingerprint = body.deviceFingerprint || request.headers.get("x-device-fingerprint") || "";

    if (!token) {
      return badRequest("Refresh token is required.");
    }

    const { user, session } = await validateSessionToken({ token, expectedType: "refresh", tabId, deviceFingerprint });
    const { accessToken, refreshToken } = await rotateSessionTokens(session);

    return jsonResponse(createAuthResponsePayload(user, session, accessToken, refreshToken));
  } catch (error) {
    return jsonResponse({ message: error.message || "Unable to refresh session." }, 401);
  }
}
