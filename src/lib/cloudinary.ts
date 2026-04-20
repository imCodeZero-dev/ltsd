// Cloudinary server-side utility — smart upload with WebP conversion + compression
// Uses CLOUDINARY_FOLDER_NAME from env for all uploads.

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const FOLDER = process.env.CLOUDINARY_FOLDER_NAME ?? "ltsd";

export interface UploadResult {
  url:      string;   // HTTPS delivery URL (WebP, compressed)
  publicId: string;   // For deletion or re-transformation later
  width:    number;
  height:   number;
  bytes:    number;   // Final file size in bytes
}

/**
 * Upload any image (data URL, remote URL, file path) to Cloudinary.
 * Automatically converts to WebP, compresses to quality:auto, resizes to fit maxDimension.
 *
 * @param source     Data URL, remote URL, or local file path
 * @param publicId   Unique identifier within the folder (e.g. user ID)
 * @param maxDimension Maximum width/height in pixels (default 800)
 */
export async function uploadImage(
  source:       string,
  publicId:     string,
  maxDimension = 800,
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(source, {
    folder:        FOLDER,
    public_id:     publicId,
    overwrite:     true,
    resource_type: "image",
    // Convert to WebP + auto-compress + resize
    transformation: [
      {
        width:   maxDimension,
        height:  maxDimension,
        crop:    "limit",      // Shrink to fit, never upscale
        quality: "auto:best",  // Perceptual quality — finds smallest file that looks the same
        fetch_format: "webp",  // Always output WebP
      },
    ],
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    bytes:    result.bytes,
  };
}

/**
 * Upload a user avatar. Face-centered square crop at 400×400, WebP.
 */
export async function uploadAvatar(
  source: string,
  userId: string,
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(source, {
    folder:        `${FOLDER}/avatars`,
    public_id:     userId,
    overwrite:     true,
    resource_type: "image",
    transformation: [
      {
        width:        400,
        height:       400,
        gravity:      "face",
        crop:         "fill",
        quality:      "auto:good",
        fetch_format: "webp",
      },
    ],
  });

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    bytes:    result.bytes,
  };
}

/**
 * Delete a previously uploaded image by its public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export { cloudinary };
