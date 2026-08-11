//! /usr/bin/env node
// src/scripts/remove-product-images.js
/**
 * Undo image assignments that were recorded in ProductImageHistory.
 *
 * Usage:
 *   node src/scripts/remove-product-images.js <sku>
 *   node src/scripts/remove-product-images.js all   // remove for all SKUs in history
 *
 * The script will:
 *   1. Load history entries (optionally filtered by SKU).
 *   2. For each entry, pull the matching image from the Part.gallery array.
 *   3. Delete the history document.
 */

import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import ProductImageHistory from "@/src/models/ProductImageHistory";

async function main() {
  const [, , skuArg] = process.argv;
  if (!skuArg) {
    console.error("❌  Provide a SKU or the keyword 'all'");
    process.exit(1);
  }

  await connectMongo();

  const filter = skuArg === "all" ? {} : { sku: skuArg };
  const histories = await ProductImageHistory.find(filter).lean();

  if (histories.length === 0) {
    console.log("📭  No history entries found for the given filter.");
    process.exit(0);
  }

  for (const h of histories) {
    const { sku, filename } = h;
    // Pull the image entry from the product's gallery array where url matches.
    const url = `/images/products/${filename}`;
    await Part.updateOne({ sku }, { $pull: { gallery: { url } } });
    await ProductImageHistory.deleteOne({ _id: h._id });
    console.log(`🗑️  Removed ${filename} from SKU ${sku}`);
  }

  console.log("\n✅  Completed removal for", histories.length, "entries.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
