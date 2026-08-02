import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Post from "../models/postModel.js";
import View from "../models/postViewsModel.js";

export const postViews = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  const existingViews = await View.findOne({ post: postId, viewer: userId });

  if (existingViews) return;

  await View.create({ post: postId, viewer: userId });
  await Post.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } });

  res.status(200).json({
    status: "Success",
  });
});
