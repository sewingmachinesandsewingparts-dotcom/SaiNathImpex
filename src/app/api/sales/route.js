import connectMongo from "@/src/lib/mongo";
import Sale from "@/src/models/Sale";
import { jsonResponse, errorResponse } from "@/src/lib/api";

async function getNextSaleId() {
  const [highestSale] = await Sale.aggregate([
    { $match: { id: { $regex: "^SALE-\\d+$" } } },
    { $project: { num: { $toInt: { $substrBytes: ["$id", 5, 100] } } } },
    { $sort: { num: -1 } },
    { $limit: 1 },
  ]);

  return `SALE-${(highestSale?.num || 202) + 1}`;
}

export async function GET() {
  await connectMongo();

  try {
    const sales = await Sale.find({});
    return jsonResponse(sales);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { name, scope, scopeRef, percent, endsAt } = body;

    if (!name || !scope || !scopeRef || !percent || !endsAt) {
      return errorResponse("Missing sale fields. name, scope, scopeRef, percent, and endsAt are required.", 400);
    }

    const allowedScopes = ["all", "brand", "model", "category", "price_range", "stitch_type"];
    if (!allowedScopes.includes(scope)) {
      return errorResponse("Invalid sale scope.", 400);
    }

    const saleId = await getNextSaleId();

    const newSale = new Sale({
      id: saleId,
      name,
      scope,
      scopeRef,
      percent: Number(percent),
      endsAt: new Date(endsAt),
    });

    const savedSale = await newSale.save();
    return jsonResponse(savedSale, 201);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

export async function PATCH(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { id, name, scope, scopeRef, percent, endsAt } = body;
    if (!id) {
      return errorResponse("Sale id is required.", 400);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (scope !== undefined) updates.scope = scope;
    if (scopeRef !== undefined) updates.scopeRef = scopeRef;
    if (percent !== undefined) updates.percent = Number(percent);
    if (endsAt !== undefined) updates.endsAt = new Date(endsAt);

    if (Object.keys(updates).length === 0) {
      return errorResponse("No update fields provided.", 400);
    }

    const updatedSale = await Sale.findOneAndUpdate({ id }, updates, { new: true });
    if (!updatedSale) {
      return errorResponse(`Sale not found with id ${id}`, 404);
    }

    return jsonResponse(updatedSale);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

export async function DELETE(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return errorResponse("Sale id is required for deletion.", 400);
    }

    const deletedSale = await Sale.findOneAndDelete({ id });
    if (!deletedSale) {
      return errorResponse(`Sale not found with id ${id}`, 404);
    }

    return jsonResponse({ success: true, deletedId: id });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}
