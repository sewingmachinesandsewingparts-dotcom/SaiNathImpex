import { jsonResponse, badRequest } from "@/src/lib/api";
import { deactivateSession, validateSessionToken } from "@/src/lib/session-auth";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.accessToken || body.refreshToken || "";
    const tabId = body.tabId || request.headers.get("x-tab-id") || "";
    const deviceFingerprint = body.deviceFingerprint || request.headers.get("x-device-fingerprint") || "";

    if (!token) {
      return badRequest("Session token is required.");
    }

    const { session } = await validateSessionToken({ token, expectedType: body.refreshToken ? "refresh" : "access", tabId, deviceFingerprint });
    await deactivateSession(session);

    return jsonResponse({ success: true, tabId });
  } catch (error) {
    return jsonResponse({ message: error.message || "Unable to logout." }, 401);
  }
}
