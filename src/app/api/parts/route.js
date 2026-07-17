import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import { saveUploadedImages, ensureBrandAndModel, buildPartFilter, buildSortOptions, parsePartFormData, createPartPayload, syncPartSeries } from "@/src/lib/part";
import { jsonResponse, badRequest, errorResponse, safeString } from "@/src/lib/api";
import { getActorFromRequest, canAccessAdminModule } from "@/src/lib/admin-auth";

export async function GET(request) {
  await connectMongo();

  try {
    const { searchParams } = new URL(request.url);
    const filter = buildPartFilter({
      q: searchParams.get("q"),
      brand: searchParams.get("brand"),
      model: searchParams.get("model"),       // filters by modelSlug (brand model pages)
      category: searchParams.get("category"), // filters by categoryRootSlug (category pages)
      skus: searchParams.get("skus"),         // filters by specific SKUs (used in cart/wishlist)
      stitchType: searchParams.get("stitchType"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      inStockOnly: searchParams.get("inStockOnly"),
      onSale: searchParams.get("onSale"),
      nameOnly: searchParams.get("nameOnly") === "true",
    });
    const parts = await Part.find(filter).sort(buildSortOptions(searchParams.get("sort"))).lean();

    // Cache parts list for 5 seconds locally, with stale-while-revalidate for fast page transitions
    return jsonResponse(parts, 200, {
      "Cache-Control": "public, max-age=5, stale-while-revalidate=60",
    });
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request) {
  await connectMongo();

  const actor = await getActorFromRequest(request);
  if (!canAccessAdminModule(actor, "parts")) {
    return errorResponse("Unauthorized. Admin access required.", 403);
  }

  try {
    const formData = await request.formData();
    const values = parsePartFormData(formData);

    console.log('[api/parts/POST] formData keys:', Array.from(formData.keys()));
    console.log('[api/parts/POST] compatibleBrands:', JSON.stringify(values.compatibleBrands).slice(0,1000));
    console.log('[api/parts/POST] linkedSeries:', JSON.stringify(values.linkedSeries).slice(0,1000));

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
    const savedPart = await newPart.save();
    await syncPartSeries(savedPart.sku, null, savedPart.linkedSeries);
    return jsonResponse(savedPart, 201);
  } catch (error) {
    if (error?.code === 11000) {
      return badRequest("Product SKU already exists.");
    }
    return errorResponse(error.message, 400);
  }
}
