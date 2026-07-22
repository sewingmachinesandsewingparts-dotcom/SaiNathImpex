import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getOAuthConfig } from "@/src/lib/google-oauth";

function buildOAuthState(tabId) {
  const csrfToken = randomBytes(16).toString("hex");
  return tabId ? `${tabId}:${csrfToken}` : csrfToken;
}

export async function GET(request) {
  try {
    const { clientId, redirectUri } = getOAuthConfig();
    const loginHint = request.nextUrl?.searchParams?.get("login_hint") || "";
    const tabId = request.nextUrl?.searchParams?.get("tab_id") || "";

    const state = buildOAuthState(tabId);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state,
    });

    if (loginHint) {
      params.set("login_hint", loginHint);
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
