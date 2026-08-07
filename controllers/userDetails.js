import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { deleteFromCloudinary } from "../middlewares/cloudinaryUpload.js";

const filterObj = (obj, ...requiredFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (requiredFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const user = await User.find()
    .populate({
      path: "posts",
      populate: {
        path: "comments",
        populate: { path: "user", select: "userName profilePic" },
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
    result: user.length,
    data: { user },
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
        { path: "user", select: "userName profilePic" },
        { path: "viewers", select: "userName profilePic" },
      ],
    })
    .populate("conversations");

  res.status(200).json({
    status: "success",
    user,
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(
      new AppError("You are not logged in to perform these action", 401),
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
        { path: "user", select: "userName profilePic" },
        { path: "viewers", select: "userName profilePic" },
      ],
    })
    .populate({
      path: "conversations",
      populate: [
        { path: "participants", select: "userName profilePic" },
        { path: "lastMessage", select: "sender text" },
      ],
    });

  res.status(200).json({
    status: "Success",
    user,
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("These route is not for password reset", 403));
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
  );

  const files = req.files || {};

  if (files.profilePic && files.profilePic.length > 0) {
    const file = files.profilePic[0];

    if (currentUser.profilePicId) {
      await deleteFromCloudinary(currentUser.profilePicId);
    }
    filteredObj.profilePic = file.media;
    filteredObj.profilePicId = file.publicId;
  }

  if (files.coverPic && files.coverPic.length > 0) {
    const file = files.coverPic[0];

    if (currentUser.coverPicId) {
      await deleteFromCloudinary(currentUser.coverPicId);
    }
    filteredObj.coverPic = file.media;
    filteredObj.coverPicId = file.publicId;
  }

  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("User Updation failed", 403));
  }

  res
    .status(203)
    .json({ status: "Success", user, message: "User Update Successfully" });
});
