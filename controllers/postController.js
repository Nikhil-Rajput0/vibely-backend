import Post from "../models/postModel.js";
import Hashtag from "../models/hashtagModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllPosts = catchAsync(async (req, res, next) => {
  const allPost = await Post.find()
    .populate({
      path: "user",
      select: "userName profilePic",
    })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "userName profilePic",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    result: allPost.length,

    data: {
      allPost,
    },

    message: "Data retrieved successfully.",
  });
});

export const createPost = catchAsync(async (req, res, next) => {
  const {
    caption,
    location,
    type = "post",
    tags = [],
    visibility = "public",
  } = req.body;

  const user = req.user.id;

  if (
    !req.files ||
    req.files.length === 0 ||
    !req.uploadedMedia ||
    req.uploadedMedia.length === 0
  ) {
    return next(
      new AppError("Please upload at least one image or video.", 400),
    );
  }

  if (!["post", "reel"].includes(type)) {
    return next(new AppError("Invalid content type.", 400));
  }

  if (type === "reel") {
    if (req.files.length !== 1) {
      return next(new AppError("A reel can contain only one video.", 400));
    }

    const file = req.files[0];

    if (!file.mimetype.startsWith("video/")) {
      return next(new AppError("A reel must contain a video.", 400));
    }
  }

  if (type === "post") {
    if (req.files.length > 10) {
      return next(new AppError("A post can contain maximum 10 files.", 400));
    }
  }

  const hashtagIds = [];
  let parsedTags = tags;

  if (typeof parsedTags === "string") {
    try {
      parsedTags = JSON.parse(parsedTags);
    } catch {
      parsedTags = parsedTags.split(",").map((tag) => tag.trim());
    }
  }

  if (!Array.isArray(parsedTags)) {
    parsedTags = [];
  }

  for (const tagName of parsedTags) {
    const cleanName = tagName.replace(/#/g, "").trim().toLowerCase();

    if (!cleanName) continue;

    const tag = await Hashtag.findOneAndUpdate(
      {
        name: cleanName,
      },
      {
        $inc: {
          postsCount: 1,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    hashtagIds.push(tag._id);
  }

  const newPost = await Post.create({
    user,
    caption,
    location,
    type,
    visibility,
    media: req.uploadedMedia,
    hashtags: hashtagIds,
  });

  res.status(201).json({
    status: "success",

    message:
      type === "reel"
        ? "Reel created successfully."
        : "Post created successfully.",

    post: newPost,
  });
});

export const getPostOfUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const posts = await Post.find({
    user: userId,
  })
    .populate({
      path: "user",
      select: "userName profilePic",
    })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "userName profilePic",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",

    result: posts.length,

    data: {
      posts,
    },
  });
});

export const deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const owner = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError("This post was not found.", 404));
  }

  if (post.user.toString() !== owner.toString()) {
    return next(
      new AppError("You are not authorized to perform this action.", 403),
    );
  }

  if (post.media && post.media.length > 0) {
    for (const media of post.media) {
      if (!media.publicId) continue;

      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.type === "video" ? "video" : "image",
      });
    }
  }

  await post.deleteOne();

  res.status(200).json({
    status: "success",

    message: "Post deleted successfully.",
  });
});
