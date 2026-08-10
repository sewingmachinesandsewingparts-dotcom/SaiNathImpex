// src/app/api/parts/bulk-assign/route.js
export const runtime = 'nodejs';
import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import ProductImageHistory from "@/src/models/ProductImageHistory";
import { jsonResponse, badRequest, errorResponse } from "@/src/lib/api";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Readable } from "node:stream";
import unzipper from "unzipper"; // ensure this package is installed
import { uploadToCloudinary } from "@/src/lib/cloudinary"; // use helper

/**
 * POST /api/parts/bulk-assign
 * Expected multipart/form-data fields:
 *   - zip: ZIP file containing JPEG images named 1.jpeg, 2.jpeg, ...
 *   - startSku: numeric SKU that should receive the first image
 *
 * For each image the handler:
 *   1️⃣ Pushes the image URL into the product's `gallery` array.
 *   2️⃣ Creates a ProductImageHistory entry for audit.
 *   3️⃣ Returns a summary of assignments.
 */
export async function POST(request) {
  try {
    await connectMongo();

    // ------------------------------------------------------------
    // 1️⃣ Parse multipart/form-data
    // ------------------------------------------------------------
    const formData = await request.formData();
    console.log('Bulk assign endpoint hit');
    console.log('FormData keys:', Array.from(formData.keys()));
    const zipFile = formData.get("zipFile");
    const startSkuRaw = formData.get("startSku");
    // Verify Cloudinary credentials are present
    const missingCreds = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingCreds.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missingCreds.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missingCreds.push('CLOUDINARY_API_SECRET');
    if (missingCreds.length) {
      console.error('Missing Cloudinary env vars:', missingCreds.join(', '));
      return errorResponse(`Cloudinary configuration missing: ${missingCreds.join(', ')}`, 500);
    }

    if (!zipFile) return badRequest("Missing 'zipFile' file.");
    if (!startSkuRaw) return badRequest("Missing 'startSku' field.");

    const skuMatch = /^([A-Za-z-]+)?(\d+)$/.exec(startSkuRaw);
    if (!skuMatch) return badRequest("Invalid startSku format. Expected optional prefix followed by number, e.g., PG-80005.");
    const prefix = skuMatch[1] || "";
    const baseNumber = Number(skuMatch[2]);
    if (Number.isNaN(baseNumber)) return badRequest("'startSku' numeric part is invalid.");

    // ------------------------------------------------------------
    // 2️⃣ Extract zip to a temporary directory
    // ------------------------------------------------------------
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bulk-assign-"));
    try {
    // Convert uploaded file (Blob) to a Node.js readable stream
    const buffer = Buffer.from(await zipFile.arrayBuffer());
    const stream = Readable.from(buffer);
    await new Promise((resolve, reject) => {
      stream
        .pipe(unzipper.Extract({ path: tmpDir }))
        .on('close', resolve)
        .on('error', reject);
    });
    } catch (e) {
      console.error('Unzip error:', e);
      return errorResponse("Failed to unzip file: " + e.message, 500);
    }

    // ------------------------------------------------------------
    // 3️⃣ Gather JPEG files and sort numerically
    // ------------------------------------------------------------
    let files;
    try {
      files = await fs.promises.readdir(tmpDir);
    } catch (e) {
      console.error('Read dir error:', e);
      return errorResponse("Unable to read extracted files: " + e.message, 500);
    }
    const jpegFiles = files
      .filter((f) => /\.(jpe?g)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (jpegFiles.length === 0) return badRequest("No JPEG images found in the zip.");

    // Cloudinary will host the images; no local folder needed

    // ------------------------------------------------------------
    // 4️⃣ Assign each image to a sequential SKU
    // ------------------------------------------------------------
    const results = [];
    for (let i = 0; i < jpegFiles.length; i++) {
      const filename = jpegFiles[i];
      const sku = `${prefix}${baseNumber + i}`;
      // Upload to Cloudinary – add logging & error handling
        let uploadResult;
        try {
          const filePath = path.join(tmpDir, filename);
          console.log('Uploading to Cloudinary:', filePath);
          uploadResult = await uploadToCloudinary(filePath, `products/${prefix ? prefix.replace(/-$/, "") : "default"}`, filename);
          console.log('Cloudinary upload success:', uploadResult.secure_url);
        } catch (uploadErr) {
          console.error('Cloudinary upload failed for', filename, uploadErr);
          results.push({ sku, status: "error", error: `Cloudinary upload failed: ${uploadErr.message}` });
          continue; // skip to next image
        }
      const url = uploadResult.secure_url;
      try {

        const product = await Part.findOne({ $or: [{ sku }, { MCG: sku }] });
      if (!product) {
        results.push({ sku, status: "not-found" });
        continue;
      }
      // Push image to gallery array and legacy images array
product.gallery.push({
  url,
  type: "Gallery",
  alt: filename,
  order: i + 1,
});
if (!product.images) product.images = [];
product.images.push(url);
await product.save();
      
        await ProductImageHistory.create({ sku, filename, url });
        results.push({ sku, status: "assigned" });
      } catch (e) {
        console.error('Assignment error for SKU', sku, e);
        results.push({ sku, status: "error", error: e.message });
      }
    }

    // ------------------------------------------------------------
    // 5️⃣ Clean up temporary folder
    // ------------------------------------------------------------
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch (_) {}

    return jsonResponse({ results }, 200);
  } catch (e) {
    console.error('Unexpected error in bulk assign:', e);
    return errorResponse(e.message || 'Internal Server Error', 500);
  }
}
