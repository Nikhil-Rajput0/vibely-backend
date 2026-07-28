import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caption: String,
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
    likesCount: {
      type: Number,
      default: 0,
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    sharesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    shavesCount: { type: Number, default: 0 },
    hashtags: [String],
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
