import express from "express";
import {
  createStory,
  deleteStory,
  viewedStory,
} from "../controllers/storyController.js";
import { protect } from "../middlewares/protectMiddleware.js";
import { uploadSingleFile } from "../middlewares/multerUpload.js";
import { uploadFileToCloudinary } from "../middlewares/cloudinaryUpload.js";
import { validateStoryVideo } from "../middlewares/validateVideoMiddleware.js";

const storyRouter = express.Router();

storyRouter.post(
  "/createStory",
  protect,
  uploadSingleFile,
  validateStoryVideo,
  uploadFileToCloudinary,
  createStory,
);

storyRouter.patch("/story/:storyId", protect, viewedStory);
storyRouter.delete("/story/:storyId", protect, deleteStory);

export default storyRouter;
