import connectMongo from "@/src/lib/mongo";
import Part from "@/src/models/Part";
import { deleteCloudinaryImages } from "@/src/lib/cloudinary";
import { saveUploadedImages, buildPartUpdateData, ensureBrandAndModel, parsePartFormData } from "@/src/lib/part";
import { getAuthCookie } from "@/src/lib/auth";
import { jsonResponse, notFound, errorResponse, safeString } from "@/src/lib/api";

function normalizeSku(value) {
  let skuValue = Array.isArray(value) ? value.join("/") : value;
  while (skuValue && /%25?2[fF]/.test(skuValue)) {
    try {
      skuValue = decodeURIComponent(skuValue);
    } catch {
      break;
    }
  }
  return skuValue;
}

export async function GET(request, { params }) {
  await connectMongo();
  const resolvedParams = await params;
  const sku = normalizeSku(resolvedParams.sku);

  try {
    const part = await Part.findOne({ sku });
    if (!part) {
      return notFound(`Part not found with SKU ${sku}`);
    }
    return jsonResponse(part);
  } catch (error) {
    return errorResponse(error.message);
  }
}

export async function POST(request, { params }) {
  await connectMongo();
  const resolvedParams = await params;
  const sku = normalizeSku(resolvedParams.sku);
  const userId = getAuthCookie(request);

  try {
    const existingPart = await Part.findOne({ sku });
    if (!existingPart) {
      return notFound(`Part not found with SKU ${sku}`);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return errorResponse("Expected application/json for review submission.", 415);
    }

    const { name, rating, comment } = await request.json();
    const ratingValue = Number(rating);
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return errorResponse("Rating must be a number between 1 and 5.", 400);
    }

    const currentReviews = existingPart.reviews || 0;
    const currentRating = existingPart.rating || 0;
    const newReviews = currentReviews + 1;
    const averageRating = Number(((currentRating * currentReviews + ratingValue) / newReviews).toFixed(1));

    const newReview = {
      userId: userId || undefined,
      name: name?.trim() || "Anonymous",
      rating: ratingValue,
      comment: comment?.trim() || "",
      createdAt: new Date(),
    };

    const updatedPart = await Part.findOneAndUpdate(
      { sku },
      {
        $push: { reviewEntries: newReview },
        $inc: { reviews: 1 },
        $set: { rating: averageRating },
      },
      { new: true },
    );

    return jsonResponse(updatedPart);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

function ownsReview(review, userId, userName) {
  if (!userId) return false;
  if (review.userId && review.userId === userId) return true;
  return !review.userId && userName && review.name === userName;
}

export async function PATCH(request, { params }) {
  await connectMongo();
  const resolvedParams = await params;
  const sku = normalizeSku(resolvedParams.sku);
  const userId = getAuthCookie(request);

  try {
    const existingPart = await Part.findOne({ sku });
    if (!existingPart) {
      return notFound(`Part not found with SKU ${sku}`);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return errorResponse("Expected application/json for review update or deletion.", 415);
    }

    const { action, reviewId, rating, comment, name } = await request.json();
    if (!reviewId) {
      return errorResponse("Review ID is required.", 400);
    }

    const review = existingPart.reviewEntries.id(reviewId);
    if (!review) {
      return notFound("Review not found.");
    }

    if (!ownsReview(review, userId, name)) {
      return errorResponse("Unauthorized to modify this review.", 403);
    }

    if (action === "delete") {
      existingPart.reviewEntries = existingPart.reviewEntries.filter(
        (entry) => entry._id?.toString() !== reviewId,
      );
    } else {
      const ratingValue = Number(rating);
      if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
        return errorResponse("Rating must be a number between 1 and 5.", 400);
      }
      review.rating = ratingValue;
      review.comment = comment?.trim() || "";
      review.name = name?.trim() || review.name;
    }

    const remainingReviews = existingPart.reviewEntries.length;
    existingPart.reviews = remainingReviews;
    existingPart.rating = remainingReviews
      ? Number((existingPart.reviewEntries.reduce((sum, entry) => sum + entry.rating, 0) / remainingReviews).toFixed(1))
      : 0;

    const updatedPart = await existingPart.save();
    return jsonResponse(updatedPart);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

export async function PUT(request, { params }) {
  await connectMongo();
  const resolvedParams = await params;
  const sku = normalizeSku(resolvedParams.sku);

  try {
    const existingPart = await Part.findOne({ sku });
    if (!existingPart) {
      return notFound(`Part not found with SKU ${sku}`);
    }

    const formData = await request.formData();
    const uploadFolder = `Home/Products/${safeString(existingPart.name || existingPart.sku)}`;
    const uploadedUrls = await saveUploadedImages(formData.getAll("images"), uploadFolder);
    const deletedImageUrls = formData.getAll("deletedImageUrls").filter(Boolean);

    if (deletedImageUrls.length > 0) {
      await deleteCloudinaryImages(deletedImageUrls);
    }

    const values = parsePartFormData(formData);
    const brandData = await ensureBrandAndModel({
      brandName: values.brandName,
      modelName: values.modelName,
      isCategoryMode: values.mode === "category",
    });

    const updatedPart = await Part.findOneAndUpdate(
      { sku },
      {
        $set: buildPartUpdateData(
          existingPart,
          formData,
          uploadedUrls,
          deletedImageUrls,
          brandData,
        ),
      },
      { new: true },
    );

    return jsonResponse(updatedPart);
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}

export async function DELETE(request, { params }) {
  await connectMongo();
  const resolvedParams = await params;
  const sku = normalizeSku(resolvedParams.sku);

  try {
    const part = await Part.findOneAndDelete({ sku });
    if (!part) {
      return notFound(`Part not found with SKU ${sku}`);
    }

    if (part.images?.length) {
      await deleteCloudinaryImages(part.images);
    }

    return jsonResponse({ message: "Part deleted successfully", sku });
  } catch (error) {
    return errorResponse(error.message, 400);
  }
}
