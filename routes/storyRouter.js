import express from "express";
import { createStory, deleteStory } from "../controllers/storyController.js";
import { protect } from "../middlewares/protectMiddleware.js";
import { uploadMediaFiles } from "../middlewares/multerUpload.js";
import { uploadMediaToCloudinary } from "../middlewares/cloudinaryUpload.js";
import { validateStoryVideo } from "../middlewares/validateVideoMiddleware.js";

const storyRouter = express.Router();

storyRouter.post(
  "/createStory",
  protect,
  uploadMediaFiles,
  validateStoryVideo,
  uploadMediaToCloudinary,
  createStory,
);

storyRouter.delete("/story/:storyId", protect, deleteStory);

export default storyRouter;
