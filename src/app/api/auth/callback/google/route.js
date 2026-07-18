import { NextResponse } from "next/server";
import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import axios from "axios";

function normalizeOrigin(value) {
  if (!value) return "";

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getRedirectUri(request) {
  const configured =
    process.env.GOOGLE_OAUTH_REDIRECT_URL ||
    process.env.Google_OAUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL;

  if (configured) {
    const normalized = normalizeOrigin(configured);
    if (/\/api\/auth\/callback\/google\/?$/i.test(configured)) {
      return configured.replace(/\/+$/, "");
    }
    return `${normalized}/api/auth/callback/google`;
  }

  const vercelUrl = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return `${normalizeOrigin(vercelUrl)}/api/auth/callback/google`;
  }

  const requestUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ||
    requestUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") || requestUrl.host;
  return `${proto}://${host}/api/auth/callback/google`;
}

function getOAuthConfig(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(request);

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured.");
  }

  return { clientId, clientSecret, redirectUri };
}

async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const res = await axios.post("https://oauth2.googleapis.com/token", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data;
  } catch (err) {
    const data = err.response?.data || {};
    throw new Error(
      data.error_description ||
        data.error ||
        "Unable to exchange auth code with Google."
    );
  }
}

async function verifyIdToken(idToken, clientId) {
  // Use id_token verification (access_token tokeninfo is deprecated)
  try {
    const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const data = res.data;

    if (data.aud && data.aud !== clientId) {
      throw new Error("The Google authentication token does not belong to this app.");
    }

    const isVerified = data.email_verified === true || data.email_verified === "true";
    if (!isVerified) {
      throw new Error("The Google account email is not verified.");
    }

    return data;
  } catch (err) {
    if (err.message.includes("Google authentication token") || err.message.includes("account email")) {
      throw err;
    }
    throw new Error("The Google authentication token is invalid.");
  }
}

async function getProfile(accessToken) {
  try {
    const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  } catch (err) {
    throw new Error("Unable to fetch Google profile.");
  }
}

function setSessionCookie(response, userId) {
  response.cookies.set({
    name: "mw_user_id",
    value: userId,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const returnedState = searchParams.get("state");

    if (error) {
      throw new Error(
        searchParams.get("error_description") ||
          "Google sign-in was cancelled."
      );
    }

    if (!code) {
      throw new Error("Missing authorization code.");
    }

    // Verify CSRF state to prevent cross-site request forgery
    const cookieHeader = request.headers.get("cookie") || "";
    const storedState = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("oauth_state="))
      ?.split("=")[1];

    if (!storedState || !returnedState || storedState !== returnedState) {
      throw new Error("Invalid OAuth state. Please try signing in again.");
    }

    const { clientId, clientSecret, redirectUri } = getOAuthConfig(request);
    const tokenData = await exchangeCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    if (!tokenData.id_token) {
      throw new Error(
        "Google did not return an ID token. Ensure 'openid' scope is requested."
      );
    }

    const tokenInfo = await verifyIdToken(tokenData.id_token, clientId);
    const profile = await getProfile(tokenData.access_token);

    const profilePicture = profile.picture || profile.image?.url || "";
    const email = (tokenInfo.email || profile.email)?.toLowerCase();

    if (!email) {
      throw new Error("Google did not return a verified email.");
    }

    await connectMongo();

    let user = await User.findOne({ email });

    if (!user) {
      const count = await User.countDocuments();
      const userId = `USR${String(count + 1).padStart(3, "0")}`;
      user = await new User({
        id: userId,
        name:
          profile.name ||
          profile.given_name ||
          email.split("@")[0] ||
          "Google User",
        email,
        password: "",
        image: profilePicture,
        status: "active",
        role: "user",
        permissions: [],
      }).save();
    } else {
      if (!user.name && profile.name) {
        user.name = profile.name;
      }
      if (profilePicture && user.image !== profilePicture) {
        user.image = profilePicture;
      }
      if (user.status === "blocked") {
        throw new Error("This account has been blocked by an administrator.");
      }
      await user.save();
    }

    const redirectPath = ["admin", "superadmin"].includes(user.role)
      ? "/admin"
      : "/profile";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    // Clear the CSRF state cookie after use
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return setSessionCookie(response, user.id);
  } catch (error) {
    const message = error.message || "Unable to sign in with Google.";
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
