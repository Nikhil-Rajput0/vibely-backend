import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

viewSchema.index(
  {
    post: 1,
    viewer: 1,
  },
  {
    unique: true,
  },
);

const View = mongoose.model("View", viewSchema);
export default View;
