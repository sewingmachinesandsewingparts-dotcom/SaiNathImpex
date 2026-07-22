export function normalizeOrigin(value) {
  if (!value) return "";

  const trimmed = value.toString().trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isLocalhost(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(
    (hostname || "").toLowerCase()
  );
}

function getRequestOrigin(request) {
  const requestUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ||
    requestUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || requestUrl.host;

  return `${proto}://${host}`;
}

export function getRedirectUri(request) {
  const requestOrigin = getRequestOrigin(request);
  const requestUrl = new URL(requestOrigin);

  const configured = (
    process.env.GOOGLE_OAUTH_REDIRECT_URL ||
    process.env.Google_OAUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    ""
  ).toString().trim();

  if (configured) {
    const configuredValue = configured.replace(/\/+$/, "");

    if (/\/api\/auth\/callback\/google\/?$/i.test(configuredValue)) {
      try {
        const configuredUrl = new URL(configuredValue);

        if (isLocalhost(requestUrl.hostname) || isLocalhost(configuredUrl.hostname)) {
          return `${requestOrigin}/api/auth/callback/google`;
        }

        return configuredValue;
      } catch {
        return configuredValue;
      }
    }

    const normalized = normalizeOrigin(configured);
    if (normalized) {
      return `${normalized}/api/auth/callback/google`;
    }
  }

  const vercelUrl = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return `${normalizeOrigin(vercelUrl)}/api/auth/callback/google`;
  }

  return `${requestOrigin}/api/auth/callback/google`;
}

export function getOAuthConfig(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri(request);

  if (!clientId || !redirectUri) {
    throw new Error(
      `Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URL or NEXT_PUBLIC_APP_URL. Resolved redirect_uri=${redirectUri}`
    );
  }

  return { clientId, redirectUri };
}

export function getOAuthConfigWithSecret(request) {
  const { clientId, redirectUri } = getOAuthConfig(request);
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_SECRET in the environment."
    );
  }

  return { clientId, clientSecret, redirectUri };
}
