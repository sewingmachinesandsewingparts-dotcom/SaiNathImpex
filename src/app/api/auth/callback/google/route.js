import { NextResponse } from "next/server";
import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import { createUser } from "@/src/lib/user";
import { buildPostLoginRedirectPath, getOAuthConfigWithSecret } from "@/src/lib/google-oauth";

async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Unable to exchange auth code with Google.");
  }

  return data;
}

async function verifyIdToken(idToken, clientId) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error_description || data.error || "The Google authentication token is invalid.");
  }

  if (data.aud && data.aud !== clientId) {
    throw new Error("The Google authentication token does not belong to this app.");
  }

  const isVerified = data.email_verified === true || data.email_verified === "true";
  if (!isVerified) {
    throw new Error("The Google account email is not verified.");
  }

  return data;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const returnedState = searchParams.get("state");

    if (error) {
      throw new Error(searchParams.get("error_description") || "Google sign-in was cancelled.");
    }

    if (!code) {
      throw new Error("Missing authorization code.");
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const storedState = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("oauth_state="))
      ?.split("=")[1];

    if (!storedState || !returnedState || storedState !== returnedState) {
      throw new Error("Invalid OAuth state. Please try signing in again.");
    }

    const { clientId, clientSecret, redirectUri } = getOAuthConfigWithSecret();
    const tokenData = await exchangeCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    if (!tokenData.id_token) {
      throw new Error("Google did not return an ID token. Ensure 'openid' scope is requested.");
    }

    const tokenInfo = await verifyIdToken(tokenData.id_token, clientId);
    const email = String(tokenInfo.email || "").toLowerCase();
    if (!email) {
      throw new Error("Google did not return a verified email.");
    }

    const displayName = tokenInfo.name || email.split("@")[0] || "Google User";
    const profilePicture = tokenInfo.picture || "";

    await connectMongo();

    let user = await User.findOne({ email });
    if (!user) {
      user = await createUser({
        name: displayName,
        email,
        password: "",
        image: profilePicture,
      });
    } else {
      if (!user.name && tokenInfo.name) {
        user.name = tokenInfo.name;
      }
      if (profilePicture && user.image !== profilePicture) {
        user.image = profilePicture;
      }
      if (user.status === "blocked") {
        throw new Error("This account has been blocked by an administrator.");
      }
      await user.save();
    }

    const redirectPath = buildPostLoginRedirectPath(user.role);
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    response.cookies.set({
      name: "mw_user_id",
      value: user.id,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const message = error.message || "Unable to sign in with Google.";
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(message)}`, request.url));
  }
}

