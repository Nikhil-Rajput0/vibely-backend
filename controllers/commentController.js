import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";

export const createComment = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user?.id;

  if (!postId || !text || !userId) {
    return next(
      new AppError("Missing required fields: postId, text, or userId", 400),
    );
  }

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    text,
  });

  post.commentsCount = post.commentsCount + 1;
  await post.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    data: {
      comment,
    },
    message: "Comment created successfully",
  });
});

export const likeComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  if (!commentId || !userId) {
    return next(new AppError("Please provide user id and comment id", 401));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new AppError("Comment does no longer exist", 404));
  }

  let message;

  const alreadyLike = comment.likes?.includes(userId);
  if (alreadyLike) {
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== userId.toString(),
    );
    await comment.save({ validateBeforeSave: false });
    message = "Comment Disliked.";
  } else {
    comment.likes?.push(userId);
    await comment.save({ validateBeforeSave: false });
    message = "Comment Liked.";
  }

  res.status(200).json({
    status: "Success",
    message,
    likes: comment.likes?.length,
  });
});
