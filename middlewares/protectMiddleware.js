import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please login to perform these action",
        401,
      ),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("The user with these id no longer exist", 403));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("The user recently changed the password", 401));
  }

  req.user = currentUser;
  next();
});
