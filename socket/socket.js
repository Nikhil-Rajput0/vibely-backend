import redis from "../config/redis.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Conversation from "../models/conversationModel.js";
import Story from "../models/storyModel.js";
import Like from "../models/likesModel.js";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";
import CommentLike from "../models/commentLikesModel.js";

export function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`Socket Connected : ${socket.id}`);

    /* ============================================================
       USER SETUP
    ============================================================ */

    socket.on("setup", async (userId) => {
      try {
        if (!userId) return;

        socket.userId = userId;

        // Store socket id in redis
        await redis.set(`socket:${userId}`, socket.id);

        // Personal room
        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: null,
        });

        socket.emit("connected");
      } catch (err) {
        console.log(err);
      }
    });

    /* ============================================================
       CONVERSATION ROOMS
    ============================================================ */

    socket.on("join_conversation", (conversationId) => {
      if (!conversationId) return;

      socket.join(conversationId);

      console.log(`${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      if (!conversationId) return;

      socket.leave(conversationId);

      console.log(`${socket.userId} left conversation ${conversationId}`);
    });

    /* ============================================================
       SEND MESSAGE
    ============================================================ */

    socket.on(
      "send_message",
      async ({ conversationId, text, media = null }, callback) => {
        try {
          if (!socket.userId) {
            return callback?.({
              success: false,
              message: "Unauthorized",
            });
          }

          if (!conversationId) {
            return callback?.({
              success: false,
              message: "Conversation Id required",
            });
          }

          if (!text?.trim() && !media) {
            return callback?.({
              success: false,
              message: "Message cannot be empty",
            });
          }

          const conversation = await Conversation.findById(conversationId);

          if (!conversation) {
            return callback?.({
              success: false,
              message: "Conversation not found",
            });
          }

          const message = await Message.create({
            conversationId,
            sender: socket.userId,
            text: text?.trim(),
            media,
          });

          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
          });

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "userName profilePic")
            .lean();

          // Send to everyone inside the conversation
          io.to(conversationId).emit("receive_message", populatedMessage);

          callback?.({
            success: true,
            message: populatedMessage,
          });
        } catch (err) {
          console.log(err);

          callback?.({
            success: false,
            message: err.message,
          });
        }
      },
    );

    /* ============================================================
       TYPING
    ============================================================ */

    socket.on("typing", ({ conversationId }) => {
      if (!conversationId || !socket.userId) return;

      socket.to(conversationId).emit("typing", {
        conversationId,
        senderId: socket.userId,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      if (!conversationId || !socket.userId) return;

      socket.to(conversationId).emit("stop_typing", {
        conversationId,
        senderId: socket.userId,
      });
    });
  });

  /* ============================================================
   STORY VIEW
============================================================ */

  socket.on("view_story", async ({ storyId }) => {
    try {
      if (!socket.userId || !storyId) return;

      const story = await Story.findOneAndUpdate(
        {
          _id: storyId,
          user: { $ne: socket.userId },
          viewers: { $ne: socket.userId },
        },
        {
          $addToSet: {
            viewers: socket.userId,
          },
        },
        {
          new: true,
        },
      );

      if (!story) return;

      const viewer = await User.findById(socket.userId)
        .select("userName profilePic")
        .lean();

      io.to(story.user.toString()).emit("story_viewed", {
        storyId: story._id,
        viewer,
        totalViews: story.viewers.length,
      });
    } catch (err) {
      console.log(err);
    }
  });

  /* ============================================================
   LIKE / UNLIKE POST
============================================================ */

  socket.on("like_post", async ({ postId }, callback) => {
    try {
      if (!socket.userId) {
        return callback?.({
          success: false,
          message: "Unauthorized",
        });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return callback?.({
          success: false,
          message: "Post not found",
        });
      }

      const existingLike = await Like.findOne({
        user: socket.userId,
        post: postId,
      });

      let liked;

      if (existingLike) {
        await existingLike.deleteOne();

        await Post.findByIdAndUpdate(postId, {
          $inc: {
            likesCount: -1,
          },
        });

        liked = false;
      } else {
        await Like.create({
          user: socket.userId,
          post: postId,
        });

        await Post.findByIdAndUpdate(postId, {
          $inc: {
            likesCount: 1,
          },
        });

        liked = true;
      }

      const updatedPost = await Post.findById(postId)
        .select("likesCount")
        .lean();

      callback?.({
        success: true,
        liked,
        likesCount: updatedPost.likesCount,
        postId,
      });

      // Future notification
      // io.to(post.user.toString()).emit("notification",{...})
    } catch (err) {
      callback?.({
        success: false,
        message: err.message,
      });
    }
  });

  /* ============================================================
   CREATE COMMENT
============================================================ */

  socket.on("create_comment", async ({ postId, text }, callback) => {
    try {
      if (!socket.userId) {
        return callback?.({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!text?.trim()) {
        return callback?.({
          success: false,
          message: "Comment cannot be empty",
        });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return callback?.({
          success: false,
          message: "Post not found",
        });
      }

      const comment = await Comment.create({
        post: postId,
        user: socket.userId,
        text: text.trim(),
      });

      await Post.findByIdAndUpdate(postId, {
        $inc: {
          commentsCount: 1,
        },
      });

      const populatedComment = await Comment.findById(comment._id)
        .populate("user", "userName profilePic")
        .lean();

      callback?.({
        success: true,
        comment: populatedComment,
      });

      // Live update to post owner
      io.to(post.user.toString()).emit("comment_created", populatedComment);
    } catch (err) {
      callback?.({
        success: false,
        message: err.message,
      });
    }
  });

  /* ============================================================
   LIKE / UNLIKE COMMENT
============================================================ */

  socket.on("like_comment", async ({ commentId }, callback) => {
    try {
      if (!socket.userId) {
        return callback?.({
          success: false,
          message: "Unauthorized",
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return callback?.({
          success: false,
          message: "Comment not found",
        });
      }

      const existingLike = await CommentLike.findOne({
        comment: commentId,
        user: socket.userId,
      });

      let liked;

      if (existingLike) {
        await existingLike.deleteOne();

        await Comment.findByIdAndUpdate(commentId, {
          $inc: {
            likesCount: -1,
          },
        });

        liked = false;
      } else {
        await CommentLike.create({
          comment: commentId,
          user: socket.userId,
        });

        await Comment.findByIdAndUpdate(commentId, {
          $inc: {
            likesCount: 1,
          },
        });

        liked = true;
      }

      const updatedComment = await Comment.findById(commentId)
        .select("likesCount")
        .lean();

      callback?.({
        success: true,
        liked,
        likesCount: updatedComment.likesCount,
        commentId,
      });
    } catch (err) {
      callback?.({
        success: false,
        message: err.message,
      });
    }
  });

  /* ============================================================
   MESSAGE SEEN
============================================================ */

  socket.on("message_seen", async ({ conversationId }, callback) => {
    try {
      if (!socket.userId) {
        return callback?.({
          success: false,
          message: "Unauthorized",
        });
      }

      await Message.updateMany(
        {
          conversationId,
          sender: {
            $ne: socket.userId,
          },
          isSeen: false,
        },
        {
          $set: {
            isSeen: true,
            seenAt: new Date(),
          },
        },
      );

      socket.to(conversationId).emit("messages_seen", {
        conversationId,
        seenBy: socket.userId,
      });

      callback?.({
        success: true,
      });
    } catch (err) {
      callback?.({
        success: false,
        message: err.message,
      });
    }
  });

  /* ============================================================
   DISCONNECT
============================================================ */

  socket.on("disconnect", async () => {
    try {
      if (!socket.userId) return;

      await redis.del(`socket:${socket.userId}`);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("user_offline", {
        userId: socket.userId,
        lastSeen: new Date(),
      });

      console.log(`${socket.userId} disconnected`);
    } catch (err) {
      console.log(err);
    }
  });
}
