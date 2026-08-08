import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jsonWebToken.js";
import AppError from "../utils/appError.js";

export const signUp = catchAsync(async (req, res, next) => {
  const { fullName, userName, email, password, passwordConfirm } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return next(
      new AppError(
        "These user is already exist please try login instead.",
        400,
      ),
    );
  }

  const newUser = await User.create({
    fullName,
    userName,
    email,
    password,
    passwordConfirm,
  });

  const accessToken = generateAccessToken(newUser._id);
  const refreshToken = generateRefreshToken(newUser._id);
  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });

  res.status(201).json({ message: "Sign Up Success" });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please Enter both email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError("Email or password is incorrect, Please try again!", 401),
    );
  }

  if (!user.isVerified) {
    return next(new AppError("You are not verified yet"));
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      status: "Sucess",
      accessToken,
      message: "Login Success.",
    });
});
