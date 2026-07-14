import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import { getAuthCookie } from "@/src/lib/auth";
import { getUserPermissions } from "@/src/lib/admin-permissions";

export async function getActorFromRequest(request) {
  const userId = getAuthCookie(request);
  if (!userId) return null;

  await connectMongo();
  return User.findOne({ id: userId });
}

export function isAdminActor(actor) {
  return Boolean(
    actor && actor.status === "active" && ["admin", "superadmin"].includes(actor.role),
  );
}

export function canAccessAdminModule(actor, moduleName) {
  if (!isAdminActor(actor)) {
    return false;
  }

  if (actor.role === "superadmin") {
    return true;
  }

  if (!moduleName) {
    return true;
  }

  return getUserPermissions(actor).includes(String(moduleName).trim().toLowerCase());
}
