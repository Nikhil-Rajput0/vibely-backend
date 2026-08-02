import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostOfUser,
} from "../controllers/postController.js";
import { protect } from "../middlewares/protectMiddleware.js";
import { uploadSingleFile } from "../middlewares/multerUpload.js";
import { uploadFileToCloudinary } from "../middlewares/cloudinaryUpload.js";
import { savedPosts } from "../controllers/savedPostController.js";
import { validatePostVideo } from "../middlewares/validateVideoMiddleware.js";
import { postViews } from "../controllers/postViewsController.js";

const postRouter = express.Router();

postRouter
  .route("/allPost")
  .get(protect, getAllPosts)
  .post(
    protect,
    uploadSingleFile,
    validatePostVideo,
    uploadFileToCloudinary,
    createPost,
  );

postRouter.route("/usersAllPost/:userId").get(protect, getPostOfUser);

postRouter.route("/post/:postId").delete(protect, deletePost);
postRouter.route("/post/:postId").post(protect, postViews);
postRouter.route("/saved/:postId").post(protect, savedPosts);

export default postRouter;
