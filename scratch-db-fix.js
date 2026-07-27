import mongoose from "mongoose";

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/stitch-parts-finder");
  const db = mongoose.connection.db;
  const parts = db.collection("parts");

  // Remove the minimal placeholder seeds I created earlier
  await parts.deleteMany({ sku: { $in: ["PEG-NP-PG80005-209298", "PEG-NP-PG80005-209299"] } });
  console.log("Removed placeholder seeds.");

  // Insert the real corrected document (mirrors Atlas data but with correct MCG/OEM/SKU fields)
  const now = new Date();
  const realDoc = {
    sku: "PEG-NP-PG80005-209298",   // FIXED (was PEG-NP-80005209298-L52-01)
    MCG: "PG-80005",                 // FIXED (was "209298")
    OEM: "209298",                   // FIXED (was "L52-01")
    id1: "PG-80005",                 // FIXED (was "209298")
    id2: "209298",                   // FIXED (was "L52-01")
    name: "Pegasus Needle Plate PG80005 209298",  // FIXED
    description: "OEM 2mm needle plate for PEGASUS L52-01 industrial overlock sewing machines.",
    price: 300,
    compareAt: 0,
    stock: 0,
    stockAlert: 5,
    hasMotor: false,
    diagramNumber: "209298",
    altPartNumbers: ["209298", "L52-01"],
    images: [
      "https://res.cloudinary.com/ck1z5bvn/image/upload/v1784974757/Home/Products/PEGASUS%20Needle%20Plate%20%282mm%29/Home/Products/PEGASUS-Needle-Plate-2mm/1784974757248-6.jpeg.jpg"
    ],
    compat: {
      machineModels: ["PEGASUS L52-01"],
      needleSystem: "",
      threadType: "",
      stitchType: ["Overlock"],
    },
    specs: { material: "Hardened Steel", weight: "" },
    maintenance: { replacementInterval_hours: 0 },
    brandSlug: "pegasus",
    brandName: "Pegasus",
    modelSlug: "l52-01",
    modelName: "L52-01",
    categoryRoot: "Needle Plates",
    categoryRootSlug: "needle-plates",
    isBrand: false,
    linkedSeries: {               // FIXED (was series:"", products:[])
      series: "PG-80005",
      products: ["PEG-NP-PG80005-209298", "PEG-NP-PG80005-209299"],
    },
    rating: 0,
    reviews: 0,
    reviewEntries: [],
    taxonomy: {
      department: "Industrial Sewing Machine Parts",
      category: "",
      subCategory: "Overlock Needle Plates",
      productType: "",
      family: "",
    },
    manufacturer: "PEGASUS",
    manufacturerCountry: "Japan",
    status: "Active",
    keywords: ["PEGASUS", "Needle Plate", "PG-80005", "209298", "L52-01", "2mm", "Overlock", "Industrial Sewing Machine Parts"],
    aliases: ["209298", "L52-01", "2mm Needle Plate", "PG-80005 Needle Plate"],
    crossReferences: [
      { number: "209298", manufacturer: "PEGASUS", type: "OEM" },
      { number: "L52-01", manufacturer: "PEGASUS", type: "Equivalent" },
    ],
    specificationGroups: [
      { group: "Dimensions", items: [{ key: "Needle Gauge", value: "2", unit: "mm" }] },
      { group: "Material", items: [{ key: "Material", value: "Hardened Steel", unit: "" }] },
    ],
    compatibleBrands: [
      { brand: "PEGASUS", machines: [{ model: "L52-01" }] }
    ],
    series: [
      {
        id: "PG-80005",
        code: "PG-80005",
        name: "PG-80005 Needle Plate Series",
        description: "PEGASUS OEM needle plate series.",
        specifications: [
          { group: "Dimensions", items: [{ key: "Needle Gauge", value: "2", unit: "mm" }] },
        ],
        products: [
          {
            sku: "PEG-NP-PG80005-209298",
            code: "209298",
            name: "PEGASUS Needle Plate (2mm)",
            barcode: "",
            attributes: [{ key: "Needle Gauge", value: "2", unit: "mm" }],
            specifications: [
              { group: "Material", items: [{ key: "Material", value: "Hardened Steel", unit: "" }] },
            ],
            crossReferences: [
              { number: "209298", manufacturer: "PEGASUS", type: "OEM" },
              { number: "L52-01", manufacturer: "PEGASUS", type: "Equivalent" },
            ],
            compatibility: [
              {
                brand: "PEGASUS",
                machines: [{ model: "L52-01", series: "L52", machineType: "Industrial Overlock Machine", needleSystem: "", notes: "2mm needle gauge." }],
              },
            ],
            images: [],
            documents: [],
            inventory: { warehouse: "Main", quantity: 0, reserved: 0, minimum: 5 },
            pricing: { currency: "USD", cost: 0, wholesale: 0, retail: 0 },
            status: "Active",
          },
        ],
      },
    ],
    documents: [],
    gallery: [],
    seo: {
      slug: "pegasus-pg-80005-209298-needle-plate-2mm",
      title: "PEGASUS PG-80005 209298 Needle Plate (2mm)",
      description: "OEM PEGASUS needle plate 209298 for L52-01 industrial overlock sewing machine with 2mm needle gauge.",
      keywords: ["PEGASUS", "209298", "PG-80005", "L52-01", "Needle Plate", "2mm"],
    },
    createdAt: now,
    updatedAt: now,
  };

  await parts.insertOne(realDoc);
  console.log("✅ Inserted corrected real document:", realDoc.sku);
  console.log("   MCG:", realDoc.MCG, "| OEM:", realDoc.OEM);

  const total = await parts.countDocuments();
  console.log("Total parts in local DB:", total);

  await mongoose.disconnect();
}

run().catch(console.error);
