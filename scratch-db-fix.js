import { buildPartFilter } from "./src/lib/part.js";

// Simulate what the MCG page sends: brand=pegasus&mcg=PG-80005
const filter = buildPartFilter({ brand: "pegasus", mcg: "PG-80005" });
console.log("Filter:", JSON.stringify(filter, null, 2));

// Also test what MCG field the parts have
import mongoose from "mongoose";
await mongoose.connect("mongodb://127.0.0.1:27017/stitch-parts-finder");
const db = mongoose.connection.db;
const parts = await db.collection("parts").find(filter).toArray();
console.log(`\nParts matched: ${parts.length}`);
parts.forEach(p => console.log(" -", p.sku, "| MCG:", p.MCG));
await mongoose.disconnect();
