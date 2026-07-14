import connectMongo from "@/src/lib/mongo";
import Order from "@/src/models/Order";
import Part from "@/src/models/Part";
import User from "@/src/models/User";
import { jsonResponse, badRequest, errorResponse, parseSearchParam } from "@/src/lib/api";

export async function GET(request) {
  await connectMongo();

  try {
    const email = parseSearchParam(request, "email");
    const id = parseSearchParam(request, "id");
    const query = id
      ? { id }
      : email
      ? { customerEmail: email }
      : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return jsonResponse(orders);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { items, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, total } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest("No items in order.");
    }

    const count = await Order.countDocuments();
    const orderId = `ORD-2026-${1000 + count + Math.floor(Math.random() * 100)}`;

    for (const item of items) {
      const part = await Part.findOne({ sku: item.sku });
      if (part) {
        part.stock = Math.max(0, part.stock - Number(item.qty || 0));
        await part.save();
      }
    }

    const savedOrder = await new Order({
      id: orderId,
      placedAt: new Date().toISOString().split("T")[0],
      status: "placed",
      total,
      itemsCount: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
    }).save();

    const user = await User.findOne({ email: customerEmail });
    if (user) {
      user.orders += 1;
      user.spent += total;
      await user.save();
    } else {
      const userCount = await User.countDocuments();
      await new User({
        id: `USR${String(userCount + 1).padStart(3, "0")}`,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        orders: 1,
        spent: total,
        status: "active",
        role: "user",
      }).save();
    }

    return jsonResponse(savedOrder, 201);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}
