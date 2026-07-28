import multer from "multer";
import AppError from "../utils/appError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
  if (
    file.mimetype.startsWith("image") ||
    allowedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new AppError("Only image and videos are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export const uploadSingleFile = upload.single("media");
