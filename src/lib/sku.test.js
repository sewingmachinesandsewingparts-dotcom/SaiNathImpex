import test from "node:test";
import assert from "node:assert/strict";
import { buildSkuFromName, buildSku, buildProductName } from "./sku.js";

test("buildSkuFromName creates a stable sku from the product name", () => {
  assert.equal(buildSkuFromName("Rotary Hook Assembly"), "PART-ROTARY-HOOK-ASSEMBLY");
  assert.equal(buildSkuFromName("   Needle Plate  "), "PART-NEEDLE-PLATE");
  assert.equal(buildSkuFromName(""), "PART");
});

test("buildSku and buildProductName match README rules with ISC", () => {
  assert.equal(buildSku("Eye Guard", "HX", "35000", "747D"), "EYE-HX35000-747D");
  assert.equal(buildProductName("Eye Guard", "HX", "35000", "747D"), "Eye Guard Hx-35000 747D");
});

test("buildSku and buildProductName match README rules without ISC", () => {
  assert.equal(buildSku("Eye Guard", "HX", "51693", ""), "EYE-HX-51693");
  assert.equal(buildProductName("Eye Guard", "HX", "51693", ""), "Eye Guard for Hx-51693");
});

test("buildSku and buildProductName use PUL for Puller category", () => {
  assert.equal(buildSku("Puller", "HX", "51693", ""), "PUL-HX-51693");
  assert.equal(buildProductName("Puller", "HX", "51693", ""), "Puller for Hx-51693");
});

test("buildSku and buildProductName use MOT for Motor category", () => {
  assert.equal(buildSku("Motor", "HX", "51693", ""), "MOT-HX-51693");
  assert.equal(buildProductName("Motor", "HX", "51693", ""), "Motor for Hx-51693");
});

test("buildSku and buildProductName use PUC for Puller Case category", () => {
  assert.equal(buildSku("Puller Case", "HX", "51693", ""), "PUC-HX-51693");
  assert.equal(buildProductName("Puller Case", "HX", "51693", ""), "Puller Case for Hx-51693");
});

test("buildSku and buildProductName use PCS for Puller Case Suit category", () => {
  assert.equal(buildSku("Puller Case Suit", "HX", "51693", ""), "PCS-HX-51693");
  assert.equal(buildProductName("Puller Case Suit", "HX", "51693", ""), "Puller Case Suit for Hx-51693");
});

test("buildSku and buildProductName use BOB for Bobbin category", () => {
  assert.equal(buildSku("Bobbin", "BX", "12345", ""), "BOB-BX-12345");
  assert.equal(buildProductName("Bobbin", "BX", "12345", ""), "Bobbin for Bx-12345");
});

test("buildSku and buildProductName use BCA for Bobbin Case category", () => {
  assert.equal(buildSku("Bobbin Case", "BX", "12345", ""), "BCA-BX-12345");
  assert.equal(buildProductName("Bobbin Case", "BX", "12345", ""), "Bobbin Case for Bx-12345");
});

test("buildSku and buildProductName use BCS for Bobbin Case Suit category", () => {
  assert.equal(buildSku("Bobbin Case Suit", "BX", "12345", ""), "BCS-BX-12345");
  assert.equal(buildProductName("Bobbin Case Suit", "BX", "12345", ""), "Bobbin Case Suit for Bx-12345");
});

test("buildSku and buildProductName match README rules for branded products", () => {
  assert.equal(buildSku("Eye Guard", "HX", "35000", "747D", "Pegasus"), "PEG-EYE-HX35000-747D");
  assert.equal(
    buildProductName("Eye Guard", "HX", "35000", "747D", "Pegasus"),
    "Pegasus Eye Guard Hx-35000 747D",
  );
});
