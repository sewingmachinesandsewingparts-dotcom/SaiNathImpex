import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder, originalName) => {
  const publicId = `${folder}/${Date.now()}-${originalName}`
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_/.]/g, "");

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    public_id: publicId,
    overwrite: false,
  });

  return result;
};

const getCloudinaryPublicIdFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === "upload");
    if (uploadIndex === -1) return null;

    let publicIdSegments = segments.slice(uploadIndex + 1);
    if (publicIdSegments.length === 0) return null;

    if (publicIdSegments[0].startsWith("v") && /^[0-9]+$/.test(publicIdSegments[0].slice(1))) {
      publicIdSegments = publicIdSegments.slice(1);
    }

    const publicIdWithExt = publicIdSegments.join("/");
    return publicIdWithExt.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
};

export const deleteCloudinaryImages = async (imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  await Promise.all(
    imageUrls.map(async (url) => {
      const publicId = getCloudinaryPublicIdFromUrl(url);
      if (!publicId) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => null);
    }),
  );
};
