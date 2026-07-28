import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Like from "../models/likesModel.js";
import Post from "../models/postModel.js";

export const likePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user.id;

  if (!postId || !userId) {
    return next(new AppError("Post ID and User ID are required", 400));
  }

  const user = await Like.findOne({ user: userId }).populate({
    path: "user",
    select: "userName",
  });
  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  let message;

  const existingLike = await Like.findOne({ user: userId, post: postId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    post.likesCount = Math.max(0, post.likesCount - 1);
    message = "Post unliked successfully";
  } else {
    await Like.create({ user: userId, post: postId });
    post.likesCount = post.likesCount + 1;
    message = "Post liked successfully";
  }

  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message,
    likesCount: post.likesCount,
  });
});
