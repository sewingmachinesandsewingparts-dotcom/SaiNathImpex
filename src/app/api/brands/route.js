import connectMongo from "@/src/lib/mongo";
import Brand from "@/src/models/Brand";
import { jsonResponse, badRequest, notFound, errorResponse, parseSearchParam } from "@/src/lib/api";

export async function GET() {
  await connectMongo();

  try {
    const brands = await Brand.find({});
    return jsonResponse(brands);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function DELETE(request) {
  await connectMongo();

  try {
    const slug = parseSearchParam(request, "slug");
    const modelSlug = parseSearchParam(request, "modelSlug");
    if (!slug) {
      return badRequest("Brand slug is required.");
    }

    if (modelSlug) {
      const brand = await Brand.findOne({ slug });
      if (!brand) {
        return notFound("Brand not found.");
      }

      const modelExists = brand.models?.some((model) => model.slug === modelSlug);
      if (!modelExists) {
        return notFound("Model not found.");
      }

      brand.models = brand.models.filter((model) => model.slug !== modelSlug);
      await brand.save();
      return jsonResponse({ message: "Model deleted." });
    }

    const deletedBrand = await Brand.findOneAndDelete({ slug });
    if (!deletedBrand) {
      return notFound("Brand not found.");
    }

    return jsonResponse({ message: "Brand deleted." });
  } catch (error) {
    return errorResponse(error.message);
  }
}
