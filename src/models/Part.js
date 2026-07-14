import mongoose from "mongoose";

const partSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    id1: { type: String },
    id2: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    compareAt: { type: Number },
    stock: { type: Number, default: 0 },
    hasMotor: { type: Boolean, default: false },
    diagramNumber: { type: String },
    altPartNumbers: [{ type: String }],
    images: [{ type: String }],
    compat: {
      machineModels: [{ type: String }],
      stitchType: [{ type: String }],
      needleSystem: { type: String },
      threadType: { type: String },
    },
    specs: {
      material: { type: String },
      weight: { type: String },
    },
    maintenance: {
      lubrication: { type: String },
      replacementInterval_hours: { type: Number },
    },
    brandSlug: { type: String },
    brandName: { type: String },
    modelSlug: { type: String },
    modelName: { type: String },
    isBrand: { type: Boolean },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    reviewEntries: [
      {
        userId: { type: String },
        name: { type: String, default: "Anonymous" },
        rating: { type: Number, required: true },
        comment: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Part = mongoose.models.Part || mongoose.model("Part", partSchema);
export default Part;
