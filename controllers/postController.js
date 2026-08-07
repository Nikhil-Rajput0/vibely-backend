import Post from "../models/postModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllPosts = catchAsync(async (req, res, next) => {
  const allPost = await Post.find().populate({
    path: "comments",
    populate: { path: "user", select: "userName profilePic" },
  });
  res.status(200).json({
    status: "Success",
    result: allPost.length,
    data: {
      allPost,
    },
    message: "Data retrieved successfully.",
  });
});

export const createPost = catchAsync(async (req, res, next) => {
  const { caption, location, type = "post", tag = [] } = req.body;
  const user = req.user.id;

  if (!req.file || !req.file.media) {
    return next(new AppError("Please upload an image or video.", 400));
  }

  const isImage = req.file.mimetype.startsWith("image/");
  const isVideo = req.file.mimetype.startsWith("video/");

  // Validate type
  if (!["post", "reel"].includes(type)) {
    return next(new AppError("Invalid content type.", 400));
  }

  // Reel must be video
  if (type === "reel" && !isVideo) {
    return next(new AppError("A reel must contain a video.", 400));
  }

  const hashtagIds = [];

  for (let tagName of tags) {
    const cleanName = tagName.replace(/#/g, "").trim().toLowerCase();

    if (cleanName) {
      const tag = await Hashtag.findOneAndUpdate(
        { name: cleanName },
        { $inc: { postsCount: 1 } },
        { new: true, upsert: true },
      );

      hashtagIds.push(tag._id);
    }
  }

  const newPost = await Post.create({
    user,
    caption,
    location,
    type,
    mediaType: isImage ? "image" : "video",
    media: req.file.media,
    cloudinaryId: req.file.publicId,
    hashtags: hashtagIds,
  });

  res.status(201).json({
    status: "success",
    message: `${type === "reel" ? "Reel" : "Post"} created successfully.`,
    post: newPost,
  });
});

export const getPostOfUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const post = await Post.find({ user: userId }).populate({
    path: "comments",
    populate: { path: "user", select: "userName profilePic" },
  });

  res.status(200).json({
    status: "Success",
    result: post.length,
    data: {
      post,
    },
  });
});

export const deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const owner = req.user.id;
  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("These post not found.", 404));
  }

  if (post.user.toString() !== owner) {
    return next(
      new AppError("You are not authorized to perform this action.", 403),
    );
  }

  if (post.cloudinaryId) {
    await cloudinary.uploader.destroy(post.cloudinaryId);
  }

  await post.deleteOne();

  res.status(200).json({
    status: "Success",
    message: "Post Deleted",
  });
});
