import Conversation from "../models/conversationModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const createConversation = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { receiverId } = req.body;

  if (!userId && !receiverId) {
    return next(new AppError("User id and receiver id is required.", 401));
  }

  if (userId === receiverId) {
    return next(new AppError("Cannot send message to yourself.", 403));
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId],
    });

    res.status(201).json({
      status: "Success",
      conversation,
    });
  }

  res.status(200).json({
    status: "Success",
    conversation,
  });
});
