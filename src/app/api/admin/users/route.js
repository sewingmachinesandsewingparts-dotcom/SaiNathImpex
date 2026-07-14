import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import { getActorFromRequest, canAccessAdminModule } from "@/src/lib/admin-auth";
import { normalizePermissions, DEFAULT_ADMIN_PERMISSIONS } from "@/src/lib/admin-permissions";
import { jsonResponse, badRequest, errorResponse } from "@/src/lib/api";

function recordActivity(user, action, target, details) {
  user.activity = user.activity || [];
  user.activity.unshift({
    action,
    target,
    details,
    createdAt: new Date(),
  });
  if (user.activity.length > 100) {
    user.activity.splice(100);
  }
}

export async function GET(request) {
  try {
    const actor = await getActorFromRequest(request);
    if (!actor) {
      return errorResponse("Unauthorized: please sign in as an admin or superadmin.", 401);
    }

    if (!canAccessAdminModule(actor, "users")) {
      return errorResponse("Forbidden: admin users permission is required to load this page.", 403);
    }

    await connectMongo();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    return jsonResponse(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
        image: user.image || "",
        joined: user.createdAt || null,
      })),
    );
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

export async function POST(request) {
  try {
    const actor = await getActorFromRequest(request);
    if (!canAccessAdminModule(actor, "users")) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { email, action, role, status, permissions } = body || {};

    if (!email || !action) {
      return badRequest("Email and action are required.");
    }

    await connectMongo();
    const targetUser = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!targetUser) {
      return badRequest("No user found with that email.");
    }

    if (action === "role") {
      if (actor.role !== "superadmin") {
        return errorResponse("Only superadmins can change roles.", 403);
      }

      const normalizedRole = String(role || "").toLowerCase();
      if (!["user", "admin", "superadmin"].includes(normalizedRole)) {
        return badRequest("Invalid role.");
      }

      targetUser.role = normalizedRole;
      if (
        normalizedRole === "admin" &&
        (!targetUser.permissions || targetUser.permissions.length === 0)
      ) {
        targetUser.permissions = [...DEFAULT_ADMIN_PERMISSIONS];
      }
      recordActivity(
        targetUser,
        "role_changed",
        `${actor.email} changed role`,
        `Role set to ${normalizedRole}`,
      );
      recordActivity(actor, "changed_role", targetUser.email, `Set role to ${normalizedRole}`);
      await Promise.all([targetUser.save(), actor.save()]);

      return jsonResponse({
        message: `${targetUser.email} is now a ${normalizedRole}.`,
      });
    }

    if (action === "permissions") {
      if (actor.role !== "superadmin") {
        return errorResponse("Only superadmins can change permissions.", 403);
      }

      if (!["admin", "superadmin"].includes(targetUser.role)) {
        return badRequest("Permissions can only be assigned to admin accounts.");
      }

      const normalizedPermissions = normalizePermissions(permissions);
      targetUser.permissions = normalizedPermissions;
      recordActivity(
        targetUser,
        "permissions_changed",
        `${actor.email} changed permissions`,
        `Permissions updated: ${normalizedPermissions.join(", ")}`,
      );
      recordActivity(
        actor,
        "changed_permissions",
        targetUser.email,
        `Updated permissions: ${normalizedPermissions.join(", ")}`,
      );
      await Promise.all([targetUser.save(), actor.save()]);

      return jsonResponse({
        message: `${targetUser.email} permissions have been updated.`,
      });
    }

    if (action === "status") {
      const normalizedStatus = String(status || "").toLowerCase();
      if (!["active", "blocked"].includes(normalizedStatus)) {
        return badRequest("Invalid status.");
      }

      targetUser.status = normalizedStatus;
      recordActivity(
        targetUser,
        "status_changed",
        `${actor.email} changed status`,
        `Status set to ${normalizedStatus}`,
      );
      recordActivity(
        actor,
        "changed_status",
        targetUser.email,
        `Set status to ${normalizedStatus}`,
      );
      await Promise.all([targetUser.save(), actor.save()]);

      return jsonResponse({
        message: `${targetUser.email} has been ${normalizedStatus === "blocked" ? "blocked" : "unblocked"}.`,
      });
    }

    return badRequest("Unsupported action.");
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}
