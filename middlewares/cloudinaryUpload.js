import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

export const uploadFileToCloudinary = (req, res, next) => {
  if (!req.file) return next();

  const isImage = req.file.mimetype.startsWith("image");
  const isVideo = req.file.mimetype.startsWith("video");

  const options = {
    folder: "medias",
    resource_type: "auto",
    quality: "auto",
    fetch_format: "auto",
  };

  if (isImage) {
    options.width = 1080;
    options.height = 1350;
    options.crop = "fill";
  }

  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) return next(error);

    req.file.media = result.secure_url;
    req.file.publicId = result.public_id;

    next();
  });

  streamifier.createReadStream(req.file.buffer).pipe(stream);
};
