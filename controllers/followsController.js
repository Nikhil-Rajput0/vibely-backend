import Follow from "../models/followsModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const toggleFollow = catchAsync(async (req, res, next) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user.id;

  // Prevent following yourself
  if (currentUserId === targetUserId) {
    return next(new AppError("You cannot follow yourself.", 400));
  }

  // Check if target user exists
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    return next(new AppError("User not found.", 404));
  }

  // Check existing follow
  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
  });

  let message;
  let isFollowing;

  if (existingFollow) {
    await Follow.findByIdAndDelete(existingFollow._id);
    message = "User unfollowed successfully.";
    isFollowing = false;
  } else {
    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });

    message = "User followed successfully.";
    isFollowing = true;
  }

  // Updated counts
  const followerCount = await Follow.countDocuments({
    following: targetUserId,
  });

  const followingCount = await Follow.countDocuments({
    follower: targetUserId,
  });

  res.status(200).json({
    status: "success",
    message,
    data: {
      isFollowing,
      followerCount,
      followingCount,
    },
  });
});

export const getFollowers = catchAsync(async (req, res) => {
  const followers = await Follow.find({
    following: req.params.userId,
  }).populate({
    path: "follower",
    select: "userName profilePic",
  });

  res.status(200).json({
    status: "success",
    results: followers.length,
    data: followers,
  });
});

export const getFollowing = catchAsync(async (req, res) => {
  const following = await Follow.find({
    follower: req.params.userId,
  }).populate({
    path: "following",
    select: "userName profilePic",
  });

  res.status(200).json({
    status: "success",
    results: following.length,
    data: following,
  });
});
