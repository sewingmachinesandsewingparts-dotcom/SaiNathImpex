import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String },
    subtitle: { type: String },
    scope: {
      type: String,
      enum: ["all", "brand", "model", "category", "price_range", "stitch_type"],
      required: true,
      default: "all",
    },
    scopeRef: { type: String, required: true },
    percent: { type: Number, required: true },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number },
    claimedPercent: { type: Number, default: 75 },
    bannerUrl: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    endsAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}

const Sale = mongoose.model("Sale", saleSchema);
export default Sale;
