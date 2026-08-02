import express from "express";
import {
  createConversation,
  deleteMessage,
  getMessage,
} from "../controllers/chatController.js";
import { protect } from "../middlewares/protectMiddleware.js";

const conversationRouter = express.Router();

conversationRouter.use(protect);

conversationRouter.post("/conversation", createConversation);
conversationRouter.get("/message/:conversationId", getMessage);
conversationRouter.delete("/message/:messageId", deleteMessage);

export default conversationRouter;
