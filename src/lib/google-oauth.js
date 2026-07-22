const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL)?.toString().trim();

export function getRedirectUri() {
  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_API_URL.");
  }
  return `${appUrl.replace(/\/+$/, "")}/api/auth/callback/google`;
}

export function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID.");
  }

  return { clientId, redirectUri };
}

export function getOAuthConfigWithSecret() {
  const { clientId, redirectUri } = getOAuthConfig();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET.");
  }

  return { clientId, clientSecret, redirectUri };
}
