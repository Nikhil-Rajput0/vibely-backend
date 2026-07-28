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
  const { caption, media, location } = req.body;
  const user = req.user.id;

  if (!req.file || !req.file.media) {
    return next(new AppError("A post must contain an image or video", 400));
  }

  const newPost = await Post.create({
    user,
    caption,
    media: req.file.media,
    cloudinaryId: req.file.publicId,
    location,
  });

  res.status(201).json({
    status: "Success",
    newPost,
    message: "Post Successfully created.",
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
