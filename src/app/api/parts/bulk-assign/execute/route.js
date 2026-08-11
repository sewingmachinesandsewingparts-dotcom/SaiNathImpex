// src/app/api/parts/bulk-assign/execute/route.js
export const runtime = 'nodejs';
import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import ProductImageHistory from "@/src/models/ProductImageHistory";
import { uploadToCloudinary } from "@/src/lib/cloudinary";
import { jsonResponse, badRequest, errorResponse, safeString } from "@/src/lib/api";
import { getActorFromRequest, canAccessAdminModule } from "@/src/lib/admin-auth";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";


export async function POST(request) {
  try {
    await connectMongo();
    
    // Auth check based on normal upload
    const actor = await getActorFromRequest(request);
    if (!canAccessAdminModule(actor, "parts")) {
      return errorResponse("Unauthorized. Admin access required.", 403);
    }

    const { batchId } = await request.json();
    if (!batchId) return badRequest("Missing batchId");

    const tmpDir = path.join(os.tmpdir(), batchId);
    
    let meta;
    try {
      const metaStr = await fs.promises.readFile(path.join(tmpDir, 'meta.json'), 'utf8');
      meta = JSON.parse(metaStr);
    } catch (e) {
      return errorResponse("Batch not found or already processed. Please re-upload.", 404);
    }

    if (!meta.isValid) {
      return badRequest("Cannot execute an invalid batch.");
    }

    const results = [];
    
    // Custom async limit function to process mapping in chunks/concurrently
    async function processConcurrently(items, concurrency, asyncFn) {
      const resultsArr = [];
      const executing = [];
      for (const item of items) {
        const p = Promise.resolve().then(() => asyncFn(item));
        resultsArr.push(p);
        if (concurrency <= items.length) {
          const e = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e);
          if (executing.length >= concurrency) {
            await Promise.race(executing);
          }
        }
      }
      return Promise.all(resultsArr);
    }

    await processConcurrently(meta.mapping, 5, async (mapping) => {
      const { sku, filename } = mapping;
      const filePath = path.join(tmpDir, filename);

      try {
        const product = await Part.findOne({ $or: [{ sku }, { MCG: sku }] });
        if (!product) {
          results.push({ sku, status: "error", error: "Product not found during execution." });
          return;
        }

        const folder = `Home/Products/${safeString(product.name || product.sku)}`;
        const uploadResult = await uploadToCloudinary(filePath, folder, filename);
        const url = uploadResult.secure_url;

        const order = product.gallery ? product.gallery.length + 1 : 1;
        
        // Ensure gallery array exists
        product.gallery = product.gallery || [];
        if (product.gallery.length > 0) {
          product.gallery[0] = { url, type: "Gallery", alt: filename, order: 1 };
        } else {
          product.gallery.push({ url, type: "Gallery", alt: filename, order });
        }

        // Ensure images array exists
        product.images = product.images || [];
        if (product.images.length > 0) {
          product.images[0] = url;
        } else {
          product.images.push(url);
        }

        await product.save();

        try {
          await ProductImageHistory.create({
            sku: product.sku,
            type: 'Gallery',
            oldImages: [],
            newImages: [url],
            user: actor?.email || 'bulk-assign'
          });
        } catch (histErr) {
          console.warn("Failed to create history record", histErr);
        }

        results.push({ sku, status: "success", url });
      } catch (err) {
        console.error(`Error processing ${sku}:`, err);
        results.push({ sku, status: "error", error: err.message });
      }
    });

    // Cleanup tmpDir
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("Failed to cleanup tmpDir", e);
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failureCount = results.length - successCount;

    return jsonResponse({
      message: "Batch processing complete",
      successCount,
      failureCount,
      results
    }, 200);

  } catch (e) {
    console.error('Unexpected error in execute:', e);
    return errorResponse(e.message || 'Internal Server Error', 500);
  }
}
