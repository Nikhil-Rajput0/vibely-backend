import express from "express";

import { login, signUp } from "../controllers/authController.js";

import {
  getAllUsers,
  getMe,
  getSingleUser,
  updateMe,
} from "../controllers/userDetails.js";

import {
  getFollowers,
  getFollowing,
  toggleFollow,
} from "../controllers/followsController.js";

import { protect } from "../middlewares/protectMiddleware.js";
import { uploadProfileAndCover } from "../middlewares/multerUpload.js";
import { uploadProfileAndCoverToCloudinary } from "../middlewares/cloudinaryUpload.js";

const userRouter = express.Router();

userRouter.post("/signUp", signUp);
userRouter.post("/login", login);

userRouter.get("/allUsers", protect, getAllUsers);
userRouter.get("/getUser/:userId", protect, getSingleUser);
userRouter.get("/getMe", protect, getMe);
userRouter.patch(
  "/updateMe",
  protect,
  uploadProfileAndCover,
  uploadProfileAndCoverToCloudinary,
  updateMe,
);

userRouter.post("/followers/:userId", protect, toggleFollow);
userRouter.get("/followers/:userId", protect, getFollowers);
userRouter.get("/following/:userId", protect, getFollowing);

export default userRouter;
