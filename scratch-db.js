import mongoose from "mongoose";
import Part from "./src/models/Part.js";
import connectMongo from "./src/lib/mongo.js";
import { buildPartFilter } from "./src/lib/part.js";

async function run() {
  await connectMongo();
  console.log("Connected to MongoDB.");

  const filter = buildPartFilter({
    brand: "pegasus",
    mcg: "PG-80005"
  });

  console.log("Built filter:", JSON.stringify(filter, null, 2));

  const parts = await Part.find(filter).lean();
  console.log(`Matching parts count: ${parts.length}`);
  parts.forEach(p => {
    console.log({
      sku: p.sku,
      name: p.name,
      MCG: p.MCG,
      OEM: p.OEM,
      linkedSeries: p.linkedSeries,
      brandSlug: p.brandSlug,
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
