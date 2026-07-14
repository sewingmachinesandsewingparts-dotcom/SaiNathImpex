import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    scope: {
      type: String,
      enum: ["all", "brand", "model", "category", "price_range", "stitch_type"],
      required: true,
      default: "all",
    },
    scopeRef: { type: String, required: true },
    percent: { type: Number, required: true },
    endsAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  },
);

const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
export default Sale;
