import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  postsCount: {
    type: Number,
    default: 0,
  },
});

const Hashtag = mongoose.model("Hashtag", hashtagSchema);
export default Hashtag;
