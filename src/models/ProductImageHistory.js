import mongoose from "mongoose";

/**
 * Keeps a log of every image that gets attached to a product.
 * Allows later undo/audit of image assignments.
 */
const historySchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },          // product identifier (e.g. "80001")
    filename: { type: String, required: true },    // original file name (e.g. "1.jpeg")
    url: { type: String, required: true },         // public URL where the image is served
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProductImageHistory =
  mongoose.models.ProductImageHistory || mongoose.model("ProductImageHistory", historySchema);

export default ProductImageHistory;
