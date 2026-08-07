import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
    },

    caption: String,

    mediaType: {
      type: String,
      required: [true, "A post must contain the type of media"],
    },

    media: {
      type: String,
      required: [true, "A post must contain image or video"],
    },

    location: String,

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    cloudinaryId: {
      type: String,
      required: true,
    },

    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    shavesCount: { type: Number, default: 0 },
    hashtags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hashtag",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

const Post = mongoose.model("Post", postSchema);
export default Post;
