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
import { serializeUser, createUser } from "@/src/lib/user";

function validateSignup(email, password, name) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
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

function loginResponse(user, status = 200) {
  return new Response(
    JSON.stringify({ user: serializeUser(user) }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setAuthCookie(user.id),
      },
    },
  );
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

    return jsonResponse({ user: serializeUser(user) });
  } catch (error) {
    return errorResponse(error.message);
  }
}

/**
 * POST: Handles traditional email/password based sign in ("mode=in")
 * and user account registration ("mode=up").
 */
export async function POST(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { mode, name, email, password } = body;

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

      const hashedPassword = hashPassword(password);
      const user = await createUser({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        image: "",
      });

      return loginResponse(user, 201);
    }

    if (!existingUser) {
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

    return loginResponse(existingUser);
  } catch (error) {
    return errorResponse(error.message, 400);
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
