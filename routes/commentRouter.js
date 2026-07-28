import express from "express";
import {
  createComment,
  likeComment,
} from "../controllers/commentController.js";
import { protect } from "../middlewares/protectMiddleware.js";

const commentRouter = express.Router();

commentRouter.post("/createComment/:postId", protect, createComment);
commentRouter.post("/comment/:commentId/likes", protect, likeComment);

export default commentRouter;
