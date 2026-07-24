import { authenticateSessionRequest, serializeUser } from "@/src/lib/session-auth";
import { jsonResponse, errorResponse } from "@/src/lib/api";

export async function GET(request) {
  try {
    const { user } = await authenticateSessionRequest(request, { expectedType: "access" });
    return jsonResponse({ user: serializeUser(user) });
  } catch (error) {
    return jsonResponse({ user: null }, 401);
  }
}
