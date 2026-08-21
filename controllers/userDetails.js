import User from "../models/userModel.js";

import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

import { deleteFromCloudinary } from "../middlewares/cloudinaryUpload.js";
import Follow from "../models/followsModel.js";

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) {
      newObj[field] = obj[field];
    }
  });

  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .select("-password -role -email")
    .populate({
      path: "posts",
      populate: {
        path: "comments",
        populate: {
          path: "user",
          select: "userName profilePic",
        },
      },
    })
    .populate({
      path: "followers",
      select: "follower -_id",
    })
    .populate({
      path: "following",
      select: "following -_id",
    });

  res.status(200).json({
    status: "Success",
    result: users.length,
    data: {
      users,
    },
    message: "All users data is fetched.",
  });
});

export const getSingleUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .populate({
      path: "posts",
      populate: {
        path: "comments",
        populate: {
          path: "user",
          select: "userName profilePic",
        },
      },
    })
    .populate({
      path: "followers",
      populate: {
        path: "follower",
        select: "userName fullName profilePic",
      },
    })
    .populate({
      path: "following",
      populate: {
        path: "following",
        select: "userName fullName profilePic",
      },
    })
    .populate({
      path: "stories",
      populate: [
        {
          path: "user",
          select: "userName profilePic",
        },
        {
          path: "viewers",
          select: "userName profilePic",
        },
      ],
    })
    .populate("conversations");

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  let isFollowing = false;

  if (req.user) {
    const currentUserId = req.user._id.toString();
    const targetUserId = user._id.toString();

    if (currentUserId !== targetUserId) {
      const follow = await Follow.findOne({
        follower: currentUserId,
        following: targetUserId,
      });

      isFollowing = !!follow;
    }
  }
  const userData = user.toObject();
  userData.isFollowing = isFollowing;

  res.status(200).json({
    status: "success",
    user: userData,
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  if (!userId) {
    return next(
      new AppError("You are not logged in to perform this action.", 401),
    );
  }

  const user = await User.findById(userId)

    .populate({
      path: "posts",
      populate: {
        path: "comments",
        populate: {
          path: "user",
          select: "userName profilePic",
        },
      },
    })

    .populate({
      path: "followers",
      populate: {
        path: "follower",
        select: "userName fullName profilePic",
      },
    })

    .populate({
      path: "following",
      populate: {
        path: "following",
        select: "userName fullName profilePic",
      },
    })

    .populate({
      path: "stories",
      populate: [
        {
          path: "user",
          select: "userName profilePic",
        },
        {
          path: "viewers",
          select: "userName profilePic",
        },
      ],
    })

    .populate({
      path: "conversations",

      populate: [
        {
          path: "participants",
          select: "userName profilePic",
        },

        {
          path: "lastMessage",
          select: "sender text",
        },
      ],
    });

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  res.status(200).json({
    status: "Success",

    user,
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password reset.", 403));
  }

  const currentUser = await User.findById(req.user.id);

  if (!currentUser) {
    return next(new AppError("User not found.", 404));
  }

  const filteredObj = filterObj(
    req.body,
    "userName",
    "fullName",
    "bio",
    "website",
    "isPrivate",
  );

  if (req.uploadedProfile) {
    if (currentUser.profilePicId) {
      await deleteFromCloudinary(currentUser.profilePicId, "image");
    }

    filteredObj.profilePic = req.uploadedProfile.url;
    filteredObj.profilePicId = req.uploadedProfile.publicId;
  }

  if (req.uploadedCover) {
    if (currentUser.coverPicId) {
      await deleteFromCloudinary(currentUser.coverPicId, "image");
    }
    filteredObj.coverPic = req.uploadedCover.url;
    filteredObj.coverPicId = req.uploadedCover.publicId;
  }

  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("User updation failed.", 403));
  }

  res.status(200).json({
    status: "Success",
    user,
    message: "User updated successfully.",
  });
});
