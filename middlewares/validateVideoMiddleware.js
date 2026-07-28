import { getVideoDurationInSeconds } from "get-video-duration";
import catchAsync from "../utils/catchAsync.js";
import { Readable } from "stream";
import AppError from "../utils/appError.js";

export const validatePostVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (!req.file.mimetype.startsWith("video/")) {
    return next();
  }

  const stream = Readable.from(req.file.buffer);
  const duration = await getVideoDurationInSeconds(stream);

  if (duration > 90) {
    return next(new AppError("Please upload file under 90 seconds", 403));
  }

  next();
});

export const validateStoryVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (!req.file.mimetype.startsWith("video/")) {
    return next();
  }

  const stream = Readable.from(req.file.buffer);
  const duration = await getVideoDurationInSeconds(stream);

  if (duration > 60) {
    return next(new AppError("Please upload file under 90 seconds", 403));
  }

  next();
});
