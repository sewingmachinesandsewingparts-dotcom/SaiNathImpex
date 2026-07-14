import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import Order from "@/src/models/Order";
import User from "@/src/models/User";
import Issue from "@/src/models/Issue";
import { getActorFromRequest, canAccessAdminModule } from "@/src/lib/admin-auth";
import { jsonResponse, errorResponse } from "@/src/lib/api";

export async function GET(request) {
  const actor = await getActorFromRequest(request);
  if (!canAccessAdminModule(actor, "dashboard")) {
    return errorResponse(
      "Unauthorized: admin or superadmin access with dashboard permission is required.",
      403,
    );
  }

  await connectMongo();

  try {
    const [
      totalOrders,
      totalUsers,
      lowStockCount,
      openIssues,
      revenueResult,
      recentOrders,
      issues,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Part.countDocuments({ stock: { $lt: 25 } }),
      Issue.countDocuments({ status: "open" }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Issue.find({ status: "open" }).sort({ createdAt: -1 }).limit(5),
    ]);

    const totalRevenue = revenueResult?.[0]?.total || 0;
    const weeklyData = [
      { d: "Mon", orders: 12, revenue: 24500 },
      { d: "Tue", orders: 18, revenue: 38200 },
      { d: "Wed", orders: 9, revenue: 19800 },
      { d: "Thu", orders: 22, revenue: 41200 },
      { d: "Fri", orders: 14, revenue: 28600 },
      { d: "Sat", orders: 7, revenue: 14400 },
      {
        d: "Sun",
        orders: recentOrders.length,
        revenue: recentOrders.reduce((sum, order) => sum + order.total, 0),
      },
    ];

    const dashboard = {
      kpis: {
        revenueWeek: totalRevenue,
        revenueMonth: totalRevenue * 4,
        ordersWeek: totalOrders,
        ordersMonth: totalOrders * 4,
        lowStock: lowStockCount,
        activeUsers: totalUsers,
        openIssues,
      },
      weekly: weeklyData,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        user: order.customerName,
        total: order.total,
        status: order.status,
        at: order.at,
      })),
      issues,
    };

    return jsonResponse(dashboard);
  } catch (error) {
    return errorResponse(error.message);
  }
}
