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
    stockAlert: { type: Number, default: 0 },
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
    categoryRoot: { type: String },
    categoryRootSlug: { type: String },
    isBrand: { type: Boolean },

    // Simple cross-product series link (stores which series this part belongs to and sibling SKUs)
    linkedSeries: {
      series: { type: String, default: "" },
      products: [{ type: String }],
    },
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
    // ======================================================
    // PRODUCT CLASSIFICATION
    // ======================================================
    taxonomy: {
      department: { type: String },
      category: { type: String },
      subCategory: { type: String },
      productType: { type: String },
      family: { type: String },
    },

    manufacturer: { type: String },
    manufacturerCountry: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Discontinued"],
      default: "Active",
    },

    keywords: [{ type: String }],
    aliases: [{ type: String }],

    // ======================================================
    // CROSS REFERENCES
    // ======================================================
    crossReferences: [
      {
        number: { type: String },
        manufacturer: { type: String },
        type: {
          type: String,
          enum: ["OEM", "Replacement", "Old", "Superseded", "Equivalent"],
          default: "OEM",
        },
      },
    ],

    // ======================================================
    // UNIVERSAL SPECIFICATIONS
    // ======================================================
    specificationGroups: [
      {
        group: { type: String },
        items: [
          { key: { type: String }, value: { type: String }, unit: { type: String } },
        ],
      },
    ],

    // ======================================================
    // COMPATIBILITY
    // ======================================================
    compatibleBrands: [
      {
        brand: { type: String },
        machines: [
          {
            model: { type: String },
            series: { type: String },
            machineType: { type: String },
            subclass: { type: String },
            needleSystem: { type: String },
            stitchType: { type: String },
            notes: { type: String },
          },
        ],
      },
    ],

    // ======================================================
    // SERIES
    // ======================================================
    series: [
      {
        id: { type: String },
        code: { type: String },
        name: { type: String },
        description: { type: String },
        specifications: [
          {
            group: { type: String },
            items: [
              { key: { type: String }, value: { type: String }, unit: { type: String } },
            ],
          },
        ],
        products: [
          {
            sku: { type: String },
            code: { type: String },
            name: { type: String },
            barcode: { type: String },
            attributes: [
              { key: { type: String }, value: { type: String }, unit: { type: String } },
            ],
            specifications: [
              {
                group: { type: String },
                items: [
                  { key: { type: String }, value: { type: String }, unit: { type: String } },
                ],
              },
            ],
            crossReferences: [
              { number: { type: String }, manufacturer: { type: String }, type: { type: String, default: "OEM" } },
            ],
            compatibility: [
              {
                brand: { type: String },
                machines: [
                  { model: { type: String }, series: { type: String }, machineType: { type: String }, needleSystem: { type: String }, notes: { type: String } },
                ],
              },
            ],
            images: [
              { url: { type: String }, type: { type: String, default: "Gallery" }, alt: { type: String }, order: { type: Number } },
            ],
            documents: [ { title: { type: String }, type: { type: String }, url: { type: String } } ],
            inventory: { warehouse: { type: String }, quantity: { type: Number, default: 0 }, reserved: { type: Number, default: 0 }, minimum: { type: Number, default: 0 } },
            pricing: { currency: { type: String, default: "USD" }, cost: { type: Number }, wholesale: { type: Number }, retail: { type: Number } },
            status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
          },
        ],
      },
    ],

    // ======================================================
    // DOCUMENTS
    // ======================================================
    documents: [ { title: { type: String }, type: { type: String }, url: { type: String } } ],

    // ======================================================
    // MEDIA
    // ======================================================
    gallery: [ { url: { type: String }, type: { type: String, default: "Gallery" }, alt: { type: String }, order: { type: Number } } ],

    // ======================================================
    // SEO
    // ======================================================
    seo: { slug: { type: String }, title: { type: String }, description: { type: String }, keywords: [{ type: String }] },
  },
  {
    timestamps: true,
  },
);

partSchema.index({ brandSlug: 1 });
partSchema.index({ modelSlug: 1 });
partSchema.index({ categoryRootSlug: 1 });
partSchema.index({ brandName: 1 });
partSchema.index({ id1: 1 });
partSchema.index({ id2: 1 });

const Part = mongoose.models.Part || mongoose.model("Part", partSchema);
export default Part;






