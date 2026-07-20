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

export const extractCloudinaryPublicIdFromUrl = (imageUrl) => {
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
    return decodeURIComponent(publicIdWithExt.replace(/\.[^.]+$/, ""));
  } catch {
    return null;
  }
};

export const extractCloudinaryFolderFromPublicId = (publicId) => {
  if (!publicId) return null;
  const parts = publicId.split("/").filter(Boolean);
  if (parts.length <= 1) return null;
  const folderParts = parts.slice(0, -1);
  return folderParts.join("/");
};

export const buildCloudinaryDeleteFolders = (imageUrls, fallbackFolders = []) => {
  const folders = new Set(
    (fallbackFolders || [])
      .map((folder) => folder?.toString().trim())
      .filter(Boolean),
  );

  for (const url of imageUrls || []) {
    const publicId = extractCloudinaryPublicIdFromUrl(url);
    const folder = extractCloudinaryFolderFromPublicId(publicId);
    if (folder) {
      folders.add(folder);
    }
  }

  return Array.from(folders);
};

export const deleteCloudinaryImages = async (imageUrls, fallbackFolders = []) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  const foldersToDelete = buildCloudinaryDeleteFolders(imageUrls, fallbackFolders);

  await Promise.all(
    imageUrls.map(async (url) => {
      const publicId = extractCloudinaryPublicIdFromUrl(url);
      if (!publicId) return;

      await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch((error) => {
        console.warn("Cloudinary image delete failed for", publicId, error?.message || error);
      });
    }),
  );

  for (const folder of foldersToDelete) {
    await cloudinary.api.delete_resources_by_prefix(folder).catch((error) => {
      console.warn("Cloudinary folder delete failed for", folder, error?.message || error);
    });

    await cloudinary.api.delete_folder(folder).catch((error) => {
      console.warn("Cloudinary folder removal failed for", folder, error?.message || error);
    });
  }
};
