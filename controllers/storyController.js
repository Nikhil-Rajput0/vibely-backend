import Story from "../models/storyModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/userModel.js";

export const createStory = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a story.", 400));
  }

  const type = req.file.mimetype.startsWith("image") ? "image" : "video";

  const story = await Story.create({
    user: req.user.id,
    media: req.file.media,
    cloudinaryId: req.file.publicId,
    type,
  });

  res.status(201).json({
    status: "success",
    story,
  });
});

export const viewedStory = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;
  const viewerId = req.user.id;

  const story = await Story.findById(storyId);

  if (!story) {
    return next(new AppError("These story is no longer exist", 404));
  }

  if (story.user.toString() === viewerId) {
    return res.status(200).json({
      status: "Success",
      message: "Owner watched story",
    });
  }

  const alreadyViewed = story.viewers?.some((id) => id.toString() != storyId);

  if (!alreadyViewed) {
    story.viewers?.push(viewerId);
    await story.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: "Success",
  });
});

export const deleteStory = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId);
  const owner = req.user.id;

  if (!story) {
    return next(new AppError("Story not found.", 404));
  }

  if (story.user.toString() !== owner) {
    return next(
      new AppError("You are not authorized to perform this action.", 403),
    );
  }

  if (story.cloudinaryId) {
    await cloudinary.uploader.destroy(story.cloudinaryId);
  }

  await story.deleteOne();

  res.status(200).json({
    status: "Success",
    message: "Story deleted successfully",
  });
});
