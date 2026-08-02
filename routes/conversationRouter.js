import express from "express";
import { createConversation } from "../controllers/chatController.js";
import { protect } from "../middlewares/protectMiddleware.js";

const conversationRouter = express.Router();

conversationRouter.use(protect);

conversationRouter.post("/conversation", createConversation);
// conversationRouter.get("/message/:converstionId");

export default conversationRouter;
