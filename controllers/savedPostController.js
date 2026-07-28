import Post from "../models/postModel.js";
import SavedPost from "../models/savedPostModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const savedPosts = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!userId || !postId) {
    return next(new AppError("Please provide both userID and postID", 400));
  }

  const user = await SavedPost.findOne({ user: userId });
  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("The Post does not longer exist.", 404));
  }

  let message;

  const existingSavedPost = await SavedPost.findOne({
    user: userId,
    post: postId,
  });

  if (existingSavedPost) {
    await SavedPost.findByIdAndDelete(existingSavedPost._id);
    post.shavesCount = Math.max(0, post.shavesCount - 1);
    message = "Shaves removed Successfully.";
  } else {
    post.shavesCount += 1;
    await SavedPost.create({ user: userId, post: postId });
    message = "Shaves created Successfully.";
  }

  await post.save({ validateBeforeSave: true });

  res.status(200).json({
    status: "Success",
    message,
    shaves: post.shavesCount,
  });
});
