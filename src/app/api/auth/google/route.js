import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildGoogleAuthUrl, getOAuthConfig } from "@/src/lib/google-oauth";

export async function GET(request) {
  try {
    const { clientId, redirectUri } = getOAuthConfig();
    const loginHint = request.nextUrl?.searchParams?.get("login_hint") || "";

    const state = randomBytes(16).toString("hex");
    const googleAuthUrl = buildGoogleAuthUrl({ clientId, redirectUri, state, loginHint });

    const response = NextResponse.redirect(googleAuthUrl);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    const message = error.message || "Google auth is unavailable.";
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(message)}`, request.url));
  }
}
