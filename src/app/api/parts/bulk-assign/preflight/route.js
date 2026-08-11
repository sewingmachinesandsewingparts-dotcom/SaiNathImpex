// src/app/api/parts/bulk-assign/preflight/route.js
export const runtime = 'nodejs';
import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import { jsonResponse, badRequest, errorResponse } from "@/src/lib/api";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Readable } from "node:stream";
import unzipper from "unzipper";

export async function POST(request) {
  try {
    await connectMongo();

    const formData = await request.formData();
    const zipFile = formData.get("zipFile");
    const startSkuRaw = formData.get("startSku");
    const endSkuRaw = formData.get("endSku");

    if (!zipFile) return badRequest("Missing 'zipFile' file.");
    if (!startSkuRaw) return badRequest("Missing 'startSku' field.");
    if (!endSkuRaw) return badRequest("Missing 'endSku' field.");

    // Parse startSku
    const startMatch = /^([A-Za-z-]+)?(\d+)$/.exec(startSkuRaw);
    if (!startMatch) return badRequest("Invalid startSku format. Expected prefix followed by number, e.g., PG-80005.");
    const prefix = startMatch[1] || "";
    const startBaseNumber = Number(startMatch[2]);

    // Parse endSku
    const endMatch = /^([A-Za-z-]+)?(\d+)$/.exec(endSkuRaw);
    if (!endMatch) return badRequest("Invalid endSku format.");
    const endPrefix = endMatch[1] || "";
    const endBaseNumber = Number(endMatch[2]);

    if (prefix !== endPrefix) return badRequest("Prefix mismatch between startSku and endSku.");
    if (startBaseNumber > endBaseNumber) return badRequest("startSku must be less than or equal to endSku.");

    const expectedCount = endBaseNumber - startBaseNumber + 1;

    // Create temp directory
    const batchId = `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tmpDir = path.join(os.tmpdir(), batchId);
    await fs.promises.mkdir(tmpDir, { recursive: true });

    try {
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

    let files;
    try {
      files = await fs.promises.readdir(tmpDir);
    } catch (e) {
      return errorResponse("Unable to read extracted files: " + e.message, 500);
    }

    const jpegFiles = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    const otherFiles = files.filter((f) => !/\.(jpe?g|png|webp)$/i.test(f));
    
    const fileMapping = [];
    const missingImages = [];
    const extraImages = [];
    let isValid = true;

    // Check mapping
    for (let i = 0; i < expectedCount; i++) {
      const num = i + 1;
      const sku = `${prefix}${startBaseNumber + i}`;
      // Find a matching image file like 1.jpeg, 1.png, 01.jpeg, etc.
      const match = jpegFiles.find(f => {
        const nameWithoutExt = path.parse(f).name;
        return Number(nameWithoutExt) === num;
      });

      if (match) {
        fileMapping.push({
          sku,
          filename: match,
          status: "pending"
        });
        // Remove from jpegFiles to find extras
        jpegFiles.splice(jpegFiles.indexOf(match), 1);
      } else {
        missingImages.push(`${num}.jpeg (for SKU ${sku})`);
        isValid = false;
      }
    }

    // Any remaining files in jpegFiles are extras
    if (jpegFiles.length > 0) {
      extraImages.push(...jpegFiles);
      isValid = false;
    }

    if (otherFiles.length > 0) {
      // Ignore OS files like .DS_Store
      const invalid = otherFiles.filter(f => !f.startsWith('.'));
      if (invalid.length > 0) isValid = false;
    }

    // Validate if products exist
    const skusToCheck = fileMapping.map(m => m.sku);
    const existingParts = await Part.find({ $or: [{ sku: { $in: skusToCheck } }, { MCG: { $in: skusToCheck } }] }, { sku: 1, MCG: 1 }).lean();
    const existingSkuSet = new Set();
    existingParts.forEach(p => {
      existingSkuSet.add(p.sku);
      if (p.MCG) existingSkuSet.add(p.MCG);
    });

    const productsNotFound = [];
    fileMapping.forEach(m => {
      if (!existingSkuSet.has(m.sku)) {
        productsNotFound.push(m.sku);
        m.status = "product-not-found";
        isValid = false;
      }
    });

    const report = {
      expectedCount,
      filesFound: files.length,
      missingImages,
      extraImages,
      productsNotFound,
      isValid,
      mapping: fileMapping,
      batchId
    };

    if (isValid) {
      await fs.promises.writeFile(path.join(tmpDir, 'meta.json'), JSON.stringify(report));
    }

    return jsonResponse(report, 200);
  } catch (e) {
    console.error('Unexpected error in preflight:', e);
    return errorResponse(e.message || 'Internal Server Error', 500);
  }
}
