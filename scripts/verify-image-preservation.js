// scripts/verify-image-preservation.js
// Run with: node scripts/verify-image-preservation.js <SKU>
// This script verifies that updating a product without providing new images preserves the existing images array.

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  withCredentials: true,
});

const sku = process.argv[2];
if (!sku) {
  console.error("Usage: node scripts/verify-image-preservation.js <SKU>");
  process.exit(1);
}

async function fetchProduct(sku) {
  const res = await api.get(`/api/parts/${encodeURIComponent(sku)}`);
  return res.data;
}

async function updateProduct(product) {
  const newName = product.name + " (test)";
  const form = new FormData();
  form.append("name", newName);
  form.append("sku", product.sku);
  form.append("mode", "brand");
  form.append("brandName", product.brandName || "");
  form.append("modelName", product.modelName || "");
  form.append("categoryRoot", product.categoryRoot || "");
  form.append("partCode", product.id1 || "");
  form.append("series", product.id1 || "");
  form.append("price", product.price ?? 0);
  form.append("compareAt", product.compareAt ?? "");
  // No new images, no deletedImageUrls.
  await api.put(`/api/parts/${encodeURIComponent(product.sku)}`, form);
}

(async () => {
  try {
    console.log("Fetching original product...");
    const original = await fetchProduct(sku);
    console.log("Original images count:", original.images?.length ?? 0);
    const originalImages = original.images?.map((url) => url) || [];

    console.log("Updating product without new images...");
    await updateProduct(original);

    console.log("Fetching updated product...");
    const updated = await fetchProduct(sku);
    console.log("Updated images count:", updated.images?.length ?? 0);
    const updatedImages = updated.images?.map((url) => url) || [];
    const same = JSON.stringify(originalImages) === JSON.stringify(updatedImages);
    console.log("Images unchanged?", same ? "YES" : "NO");
    if (!same) {
      console.log("Original:", originalImages);
      console.log("Updated:", updatedImages);
    }
  } catch (e) {
    console.error("Error during verification:", e.message);
    process.exit(1);
  }
})();
