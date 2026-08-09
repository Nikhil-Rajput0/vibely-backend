import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { _id: false },
);

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

    caption: {
      type: String,
      trim: true,
      maxlength: 2200,
    },

    media: {
      type: [mediaSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value && value.length > 0 && value.length <= 10;
        },
        message: "A post must contain between 1 and 10 media files.",
      },
    },

    location: {
      type: String,
      trim: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    savesCount: {
      type: Number,
      default: 0,
    },

    hashtags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hashtag",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

const Post = mongoose.model("Post", postSchema);

export default Post;
