import { NextResponse } from "next/server";

function getRedirectUri(request) {
  const configured = process.env.GOOGLE_OAUTH_REDIRECT_URL || process.env.Google_OAUTH_REDIRECT_URL;
  if (configured) return configured;

  const requestUrl = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || requestUrl.host;
  return `${proto}://${host}/api/auth/callback/google`;
}

function getOAuthConfig(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(request);

  if (!clientId || !redirectUri) {
    throw new Error("Google OAuth is not configured.");
  }

  return { clientId, redirectUri };
}

export async function GET(request) {
  try {
    const { clientId, redirectUri } = getOAuthConfig(request);
    const loginHint = request.nextUrl?.searchParams?.get("login_hint") || "";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account login",
      max_age: "0",
    });

    if (loginHint) {
      params.set("login_hint", loginHint);
    }

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  } catch (error) {
    const message = error.message || "Google auth is unavailable.";
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
