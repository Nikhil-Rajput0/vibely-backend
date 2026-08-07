import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

// ----- Factory for single file -----
const uploadToCloudinary =
  (options = {}) =>
  (req, res, next) => {
    if (!req.file) return next();

    const defaultOptions = {
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    };

    const finalOptions = { ...defaultOptions, ...options };

    const stream = cloudinary.uploader.upload_stream(
      finalOptions,
      (error, result) => {
        if (error) return next(error);
        req.file.media = result.secure_url;
        req.file.publicId = result.public_id;
        next();
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  };

// ----- Specific handlers for profile and cover -----
export const uploadPhotoToCloudinary = uploadToCloudinary({
  folder: "Profiles",
  width: 400,
  height: 400,
  crop: "fill",
  gravity: "face",
  quality: "auto:good",
  fetch_format: "auto",
  effect: "sharpen:200",
  radius: "max",
  background: "auto",
});

export const uploadCoverToCloudinary = uploadToCloudinary({
  folder: "covers",
  width: 1200,
  height: 400,
  crop: "fill",
  quality: "auto:good",
  fetch_format: "auto",
});

// For general media (posts)
export const uploadFileToCloudinary = uploadToCloudinary({
  folder: "medias",
  width: 1080,
  height: 1350,
  crop: "fill",
});

// ----- Wrapper for multiple files -----
export const uploadProfileAndCoverToCloudinary = (req, res, next) => {
  const files = req.files || {};
  const hasProfile = files.profilePic && files.profilePic.length > 0;
  const hasCover = files.coverPic && files.coverPic.length > 0;

  if (!hasProfile && !hasCover) return next();

  let processed = 0;
  const total = (hasProfile ? 1 : 0) + (hasCover ? 1 : 0);

  // Helper to process one field
  const processField = (fieldName, handler) => {
    if (!files[fieldName] || files[fieldName].length === 0) {
      processed++;
      if (processed === total) next();
      return;
    }

    const file = files[fieldName][0];
    const originalFile = req.file;
    req.file = file; // Temporarily set req.file for the handler

    handler(req, res, (err) => {
      if (err) return next(err);
      req.file = originalFile; // restore (though not really needed)
      processed++;
      if (processed === total) next();
    });
  };

  processField("profilePic", uploadPhotoToCloudinary);
  processField("coverPic", uploadCoverToCloudinary);
};

// ----- Deletion helper -----
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
};
