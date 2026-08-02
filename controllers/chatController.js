import Conversation from "../models/conversationModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import Message from "../models/messageModel.js";

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

export const getMessage = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  if (!conversation.participants.some((id) => id.toString() === req.user.id)) {
    return next(new AppError("You are not allowed to saw the message", 401));
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId })
    .populate({ path: "sender", select: "userName profilePic" })
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "Success",
    page,
    results: messages.length,
    messages,
  });
});

export const deleteMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);

  if (!message) {
    return next(new AppError("Message not found", 404));
  }

  if (message.sender.toString() !== req.user.id) {
    return next(new AppError("You are not allowed to delete message", 403));
  }

  await message.deleteOne();

  res.status(200).json({
    status: "Success",
    message: "Message deleted",
  });
});
