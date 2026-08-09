import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

const uploadBufferToCloudinary = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(error);
        }

        const type = file.mimetype.startsWith("image/") ? "image" : "video";

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

const defaultOptions = {
  resource_type: "auto",
  quality: "auto",
  fetch_format: "auto",
};

export const uploadPhotoToCloudinary = async (req, res, next) => {
  try {
    const file = req.files?.profilePic?.[0];

    if (!file) {
      return next();
    }

    const result = await uploadBufferToCloudinary(file, {
      ...defaultOptions,
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

    req.uploadedProfile = result;

    next();
  } catch (error) {
    next(error);
  }
};

export const uploadCoverToCloudinary = async (req, res, next) => {
  try {
    const file = req.files?.coverPic?.[0];

    if (!file) {
      return next();
    }

    const result = await uploadBufferToCloudinary(file, {
      ...defaultOptions,
      folder: "covers",
      width: 1200,
      height: 400,
      crop: "fill",
      quality: "auto:good",
      fetch_format: "auto",
    });

    req.uploadedCover = result;

    next();
  } catch (error) {
    next(error);
  }
};

export const uploadProfileAndCoverToCloudinary = async (req, res, next) => {
  try {
    const hasProfile = req.files?.profilePic?.length > 0;

    const hasCover = req.files?.coverPic?.length > 0;

    if (!hasProfile && !hasCover) {
      return next();
    }

    if (hasProfile) {
      const profileFile = req.files.profilePic[0];

      req.uploadedProfile = await uploadBufferToCloudinary(profileFile, {
        ...defaultOptions,
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
    }

    if (hasCover) {
      const coverFile = req.files.coverPic[0];

      req.uploadedCover = await uploadBufferToCloudinary(coverFile, {
        ...defaultOptions,
        folder: "covers",
        width: 1200,
        height: 400,
        crop: "fill",
        quality: "auto:good",
        fetch_format: "auto",
      });
    }

    next();
  } catch (error) {
    if (req.uploadedProfile?.publicId) {
      await deleteFromCloudinary(
        req.uploadedProfile.publicId,
        req.uploadedProfile.type,
      );
    }

    if (req.uploadedCover?.publicId) {
      await deleteFromCloudinary(
        req.uploadedCover.publicId,
        req.uploadedCover.type,
      );
    }

    next(error);
  }
};

export const uploadMediaToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const uploadedMedia = [];

    try {
      for (const file of req.files) {
        const isImage = file.mimetype.startsWith("image/");

        const isVideo = file.mimetype.startsWith("video/");

        let options = {
          ...defaultOptions,
          folder: "medias",
        };

        if (isImage) {
          options = {
            ...options,
            width: 1080,
            height: 1350,
            crop: "limit",
          };
        }

        if (isVideo) {
          options = {
            ...options,
            resource_type: "video",
          };
        }

        const result = await uploadBufferToCloudinary(file, options);

        uploadedMedia.push(result);
      }
    } catch (error) {
      for (const media of uploadedMedia) {
        await deleteFromCloudinary(media.publicId, media.type);
      }

      throw error;
    }

    req.uploadedMedia = uploadedMedia;

    next();
  } catch (error) {
    next(error);
  }
};

export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  if (!publicId) {
    return;
  }

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
};

export const deleteMultipleFromCloudinary = async (media = []) => {
  if (!Array.isArray(media)) {
    return;
  }

  for (const item of media) {
    if (!item?.publicId) {
      continue;
    }

    await deleteFromCloudinary(item.publicId, item.type);
  }
};
