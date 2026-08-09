import Story from "../models/storyModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import cloudinary from "../utils/cloudinary.js";

export const createStory = catchAsync(async (req, res, next) => {
  if (!req.uploadedMedia) {
    return next(new AppError("Please upload a story.", 400));
  }

  const type = req.uploadedMedia.resourceType === "video" ? "video" : "image";

  const story = await Story.create({
    user: req.user.id,
    media: req.uploadedMedia.url,
    cloudinaryId: req.uploadedMedia.publicId,
    type,
  });

  res.status(201).json({
    status: "success",
    story,
    message: "Story created successfully.",
  });
});

export const deleteStory = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;
  const story = await Story.findById(storyId);

  if (!story) {
    return next(new AppError("Story not found.", 404));
  }

  const owner = req.user.id.toString();
  const storyOwner = story.user.toString();

  if (storyOwner !== owner) {
    return next(
      new AppError("You are not authorized to perform this action.", 403),
    );
  }

  if (story.cloudinaryId) {
    await cloudinary.uploader.destroy(story.cloudinaryId, {
      resource_type: story.type === "video" ? "video" : "image",
    });
  }
  await story.deleteOne();

  res.status(200).json({
    status: "success",

    message: "Story deleted successfully.",
  });
});
