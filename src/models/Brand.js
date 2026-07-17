import mongoose from "mongoose";

const modelSchema = new mongoose.Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  partsCount: { type: Number, default: 0 },
});

const brandSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isBrand: { type: Boolean, default: true },
    models: [modelSchema],
  },
  {
    timestamps: true,
  },
);

brandSchema.index({ "models.slug": 1 });

const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);
export default Brand;
