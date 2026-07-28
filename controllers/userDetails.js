import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

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
    });

  res.status(200).json({
    status: "success",
    user,
  });
});
