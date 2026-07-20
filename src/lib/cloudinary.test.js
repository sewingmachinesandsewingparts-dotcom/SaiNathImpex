import test from "node:test";
import assert from "node:assert/strict";
import { extractCloudinaryPublicIdFromUrl, extractCloudinaryFolderFromPublicId } from "./cloudinary.js";

test("extractCloudinaryPublicIdFromUrl returns the decoded public ID from a Cloudinary URL", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/v1710000000/Home/Products/Test%20Product/image-1.jpg";
  assert.equal(extractCloudinaryPublicIdFromUrl(url), "Home/Products/Test Product/image-1");
});

test("extractCloudinaryFolderFromPublicId returns the parent folder path", () => {
  assert.equal(extractCloudinaryFolderFromPublicId("Home/Products/Test Product/image-1"), "Home/Products/Test Product");
  assert.equal(extractCloudinaryFolderFromPublicId("Home/support/ISS-101/photo.png"), "Home/support/ISS-101");
});
