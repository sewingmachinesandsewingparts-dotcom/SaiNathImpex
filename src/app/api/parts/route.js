import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import { saveUploadedImages, ensureBrandAndModel, buildPartFilter, buildSortOptions, parsePartFormData, createPartPayload } from "@/src/lib/part";
import { jsonResponse, badRequest, errorResponse, safeString } from "@/src/lib/api";

export async function GET(request) {
  await connectMongo();

  try {
    const { searchParams } = new URL(request.url);
    const filter = buildPartFilter({
      q: searchParams.get("q"),
      brand: searchParams.get("brand"),
      category: searchParams.get("category"),
      stitchType: searchParams.get("stitchType"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      inStockOnly: searchParams.get("inStockOnly"),
      onSale: searchParams.get("onSale"),
      nameOnly: searchParams.get("nameOnly") === "true",
    });
    const parts = await Part.find(filter).sort(buildSortOptions(searchParams.get("sort")));
    return jsonResponse(parts);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  await connectMongo();

  try {
    const formData = await request.formData();
    const values = parsePartFormData(formData);

    if (!values.name) {
      return badRequest("Product name is required.");
    }

    if (values.price === undefined || Number.isNaN(values.price)) {
      return badRequest("Product price is required and must be a number.");
    }

    const productFolder = `Home/Products/${safeString(values.name || values.sku)}`;
    const uploadedUrls = await saveUploadedImages(formData.getAll("images"), productFolder);
    const brandData = await ensureBrandAndModel({
      brandName: values.brandName,
      modelName: values.modelName,
      isCategoryMode: values.mode === "category",
    });

    const newPart = new Part(createPartPayload(values, uploadedUrls, brandData));
    return jsonResponse(await newPart.save(), 201);
  } catch (error) {
    if (error?.code === 11000) {
      return badRequest("Product SKU already exists.");
    }
    return errorResponse(error.message, 400);
  }
}
