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

export function buildGoogleAuthUrl({ clientId, redirectUri, state, loginHint = "" }) {
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

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// https://accounts.google.com/v3/signin/accountchooser?access_type=offline&client_id=241233328255-lhuod2niubdg5sipjqgcbdrammrnlmiq.apps.googleusercontent.com&prompt=select_account&redirect_uri=https%3A%2F%2Fsai-nath-impex-j9yu.vercel.app%2Fapi%2Fauth%2Fcallback%2Fgoogle&response_type=code&scope=openid+email+profile&
// state=3b40be9f7ee52ba09926f1d598a483b1&dsh=S-2146854335%3A1784700090906502&o2v=2&service=lso&flowName=GeneralOAuthFlow&opparams=%253F&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hAMj5ljpXKhEkWz1iNIncnx6IUZd0wmIyP3ZNn8iRA0gmr2LW-IYvhcYd_nY97ZkeDKZXLzHnkUiADBKgf7ukmmCJR7NAuGEzCHDj-avd3CEUlKoK50neaRAJslcickLCUTr8UR63Sh46H8N-B8UCVjTGWOUIUl9zrUcj5bMp0jukAJdDYhX_9j9hYDDbrO1VzC1XiITdmwf8MfTsvU7INiSpotfdfg_p7K0uh0O_-CkjYG1zoMET_cwcZtkXzjeUoQfm0hNapQ6JzFZAIDtVCdN1kUWCRUgcT_xDZpbXH4CRTerP_dn8uITmUFQLeMCKiTytUPA5ef8u98R5NIOA7q-ehxrThS5lLjN-dTx74mgSKhLO1A9cgHcLCk7R6DtV4dIsA29QgZfLiLhrQVt7pGaGioTWwv7_p3_C2wo8zY1-voNVYIS-5RwlahtyQjYUWSWoNSkaRPCAADG2jv37U8uy8OA1qWcgDV4uRMVuL_QN2dSoXA%26flowName%3DGeneralOAuthFlow%26as%3DS-2146854335%253A1784700090906502%26client_id%3D241233328255-lhuod2niubdg5sipjqgcbdrammrnlmiq
// .apps.googleusercontent.com%26requestPath%3D%252Fsignin%252Foauth%252Fconsent%23&app_domain=https%3A%2F%2Fsai-nath-impex-j9yu.vercel.app

export function buildPostLoginRedirectPath(role) {
  return ["admin", "superadmin"].includes((role || "").toString().toLowerCase())
    ? "/admin"
    : "/profile";
}
