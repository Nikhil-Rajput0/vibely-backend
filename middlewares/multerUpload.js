import multer from "multer";
import AppError from "../utils/appError.js";

const storage = multer.memoryStorage();

const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = allowedVideoTypes.includes(file.mimetype);

  if (isImage || isVideo) {
    return cb(null, true);
  }

  cb(new AppError("Only image and video files are allowed.", 400), false);
};

const mediaUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
  },
});

const profileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
});

export const uploadMediaFiles = mediaUpload.array("media", 10);

export const uploadProfileAndCover = profileUpload.fields([
  {
    name: "profilePic",
    maxCount: 1,
  },
  {
    name: "coverPic",
    maxCount: 1,
  },
]);
