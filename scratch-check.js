import mongoose from "mongoose";

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stitch-parts-finder";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const parts = await db.collection("parts").find({ "MCG": "PG-80005" }).toArray();
  
  console.log(`Found ${parts.length} parts for PG-80005`);
  parts.forEach(p => {
    console.log(`- sku: "${p.sku}"`);
    console.log(`  linkedSeries products:`, JSON.stringify(p.linkedSeries?.products));
  });
  
  await mongoose.disconnect();
}
run().catch(console.error);
