import connectMongo from "@/src/lib/mongo";
import User from "@/src/models/User";
import Order from "@/src/models/Order";
import { getActorFromRequest, canAccessAdminModule } from "@/src/lib/admin-auth";
import { jsonResponse, notFound, errorResponse } from "@/src/lib/api";

export async function GET(request, { params }) {
  try {
    const actor = await getActorFromRequest(request);
    if (!canAccessAdminModule(actor, "users")) {
      return errorResponse("Forbidden", 403);
    }

    await connectMongo();
    const user = await User.findOne({ id: params.id }).lean();
    if (!user) {
      return notFound("User not found.");
    }

    const orders = await Order.find({ customerEmail: user.email }).sort({ createdAt: -1 }).lean();

    return jsonResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || "",
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
        activity: user.activity || [],
        joined: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      },
      orders: orders.map((order) => ({
        id: order.id,
        placedAt: order.placedAt,
        status: order.status,
        total: order.total,
        itemsCount: order.itemsCount,
      })),
      currentUser: {
        id: actor?.id || null,
        role: actor?.role || null,
        permissions: actor?.permissions || [],
        status: actor?.status || null,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}
