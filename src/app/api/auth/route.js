import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import {
  hashPassword,
  verifyPassword,
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
} from "@/src/lib/auth";
import { jsonResponse, badRequest, errorResponse } from "@/src/lib/api";
import {
  applyLoginRateLimit,
  createSessionRecord,
  createAuthResponsePayload,
  signJwt,
  serializeUser,
  createJsonResponse,
} from "@/src/lib/session-auth";
import { buildDeviceFingerprint } from "@/src/lib/tab-session";

function validateSignup(email, password, name) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalizedEmail) {
    return "Email is required.";
  }

  if (!emailRegex.test(normalizedEmail)) {
    return "Please enter a valid email address.";
  }

  if (!name || String(name).trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }

  if (String(password || "").length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one uppercase letter and one number.";
  }

  return null;
}

/**
 * GET: Checks the active session using the encrypted session cookie.
 * Returns the currently logged in user profile, or null.
 */
export async function GET(request) {
  await connectMongo();
  try {
    const userId = getAuthCookie(request);
    if (!userId) return jsonResponse({ user: null });

    const user = await User.findOne({ id: userId });
    if (!user || user.status === "blocked") return jsonResponse({ user: null });

    return jsonResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || "",
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
      },
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}

function isGoogleAccountEmail(email) {
  return /@(gmail\.com|googlemail\.com)$/i.test(String(email || ""));
}

/**
 * POST: Handles traditional email/password based sign in ("mode=in")
 * and user account registration ("mode=up").
 */
export async function POST(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { mode, name, email, password, tabId } = body;

    applyLoginRateLimit(request);

    if (!email || !password) {
      return badRequest("Email and password are required.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const isSignup = mode === "up";
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (isSignup) {
      const validationError = validateSignup(normalizedEmail, password, name);
      if (validationError) {
        return badRequest(validationError);
      }

      if (existingUser) {
        return badRequest("This email is already registered.");
      }

      const count = await User.countDocuments();
      const userId = `USR${String(count + 1).padStart(3, "0")}`;
      const hashedPassword = hashPassword(password);

      const user = await new User({
        id: userId,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        image: "",
        status: "active",
        role: "user",
        permissions: [],
      }).save();

      const accessToken = signJwt({ sub: user.id, sessionId: `signup-${user.id}`, type: "access" }, 15 * 60);
      const refreshToken = signJwt({ sub: user.id, sessionId: `signup-${user.id}`, type: "refresh" }, 30 * 24 * 60 * 60);
      const sessionRecord = await createSessionRecord({
        user,
        tabId: tabId || `signup-${user.id}`,
        deviceFingerprint: buildDeviceFingerprint(),
        accessToken,
        refreshToken,
      });

      return createJsonResponse(
        createAuthResponsePayload(user, sessionRecord, accessToken, refreshToken),
        201,
      );
    }

    if (!existingUser) {
      if (isGoogleAccountEmail(normalizedEmail)) {
        return badRequest(
          "This looks like a Google account. Please use Continue with Google to sign in.",
        );
      }
      return badRequest("Invalid email or password.");
    }
    if (!existingUser.password) {
      return badRequest(
        "This account uses Google sign-in. Please use Continue with Google to sign in.",
      );
    }
    if (!verifyPassword(password, existingUser.password)) {
      return badRequest("Invalid email or password.");
    }

    if (existingUser.status === "blocked") {
      return badRequest("This account has been blocked by an administrator.");
    }

    const accessToken = signJwt({ sub: existingUser.id, sessionId: `login-${existingUser.id}`, type: "access" }, 15 * 60);
    const refreshToken = signJwt({ sub: existingUser.id, sessionId: `login-${existingUser.id}`, type: "refresh" }, 30 * 24 * 60 * 60);
    const sessionRecord = await createSessionRecord({
      user: existingUser,
      tabId: tabId || `login-${existingUser.id}`,
      deviceFingerprint: buildDeviceFingerprint(),
      accessToken,
      refreshToken,
    });

    return createJsonResponse(
      createAuthResponsePayload(existingUser, sessionRecord, accessToken, refreshToken),
      200,
    );
  } catch (error) {
    return errorResponse(error.message || "Unable to authenticate.", 400);
  }
}

/**
 * DELETE: Clears the session auth cookie, logging the user out.
 */
export async function DELETE() {
  return new Response(JSON.stringify({ user: null }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearAuthCookie(),
    },
  });
}
