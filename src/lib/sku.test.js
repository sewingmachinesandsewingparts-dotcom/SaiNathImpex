import test from "node:test";
import assert from "node:assert/strict";
import { buildSkuFromName, buildSku, buildProductName } from "./sku.js";

test("buildSkuFromName creates a stable sku from the product name", () => {
  assert.equal(buildSkuFromName("Rotary Hook Assembly"), "PART-ROTARY-HOOK-ASSEMBLY");
  assert.equal(buildSkuFromName("   Needle Plate  "), "PART-NEEDLE-PLATE");
  assert.equal(buildSkuFromName(""), "PART");
});

test("buildSku and buildProductName match README rules with ISC", () => {
  assert.equal(buildSku("Eye Guard", "HX", "35000", "747D"), "EG-HX35000-747D");
  assert.equal(buildProductName("Eye Guard", "HX", "35000", "747D"), "Eye Guard Hx-35000 747D");
});

test("buildSku and buildProductName match README rules without ISC", () => {
  assert.equal(buildSku("Eye Guard", "HX", "51693", ""), "EG-HX-51693");
  assert.equal(buildProductName("Eye Guard", "HX", "51693", ""), "Eye Guard for Hx-51693");
});

test("buildSku and buildProductName match README rules for branded products", () => {
  assert.equal(buildSku("Eye Guard", "HX", "35000", "747D", "Pegasus"), "PEG-EG-HX35000-747D");
  assert.equal(
    buildProductName("Eye Guard", "HX", "35000", "747D", "Pegasus"),
    "Pegasus Eye Guard Hx-35000 747D",
  );
});
