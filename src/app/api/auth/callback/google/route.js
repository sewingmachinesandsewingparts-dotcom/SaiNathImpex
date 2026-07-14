import { NextResponse } from "next/server";
import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";

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

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || "Unable to exchange auth code.");
  }

  return data;
}

async function verifyGoogleToken(accessToken, clientId) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error("The Google authentication token is invalid.");
  }

  if (data.aud && data.aud !== clientId) {
    throw new Error("The Google authentication token does not belong to this app.");
  }

  const isVerified =
    data.email_verified === true ||
    data.verified_email === true ||
    data.email_verified === "true" ||
    data.verified_email === "true";
  if (!isVerified) {
    throw new Error("The Google account email is not verified.");
  }

  return data;
}

async function getProfile(accessToken) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Unable to fetch Google profile.");
  }

  return data;
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

    if (error) {
      throw new Error(searchParams.get("error_description") || "Google sign-in was cancelled.");
    }

    if (!code) {
      throw new Error("Missing authorization code.");
    }

    const { clientId, clientSecret, redirectUri } = getOAuthConfig(request);
    const tokenData = await exchangeCode({ code, clientId, clientSecret, redirectUri });
    const tokenInfo = await verifyGoogleToken(tokenData.access_token, clientId);
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
        name: profile.name || profile.given_name || email.split("@")[0] || "Google User",
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

    const redirectPath = ["admin", "superadmin"].includes(user.role) ? "/admin" : "/profile";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    return setSessionCookie(response, user.id);
  } catch (error) {
    const message = error.message || "Unable to sign in with Google.";
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
