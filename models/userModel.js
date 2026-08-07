import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      required: [true, "A user should have an unique username"],
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "A user should have an unique email"],
      trim: true,
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email Address"],
    },
    password: {
      type: String,
      required: [true, "A user should have a strong password"],
      trim: true,
      minLength: [8, "A password is greater than 8 characters"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "A user should have matching password"],
      trim: true,
      minLength: [8, "A password is greater than 8 characters"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Confirm password must be same.",
      },
      select: false,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    profilePic: {
      type: String,
      default:
        "https://res.cloudinary.com/fjspmokn/image/upload/v1786082691/Default_user_xa1io0.png",
    },
    profilePicId: { type: String, default: "" },
    coverPic: {
      type: String,
      default: "",
    },
    coverPicId: { type: String, default: "" },
    bio: String,
    website: String,
    location: String,
    followersCount: Number,
    followingCount: Number,
    postsCount: Number,
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },

    refreshToken: String,
    changedPasswordAt: Date,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});

userSchema.virtual("followers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "following",
});

userSchema.virtual("following", {
  ref: "Follow",
  localField: "_id",
  foreignField: "follower",
});

userSchema.virtual("stories", {
  ref: "Story",
  foreignField: "user",
  localField: "_id",
});

userSchema.virtual("conversations", {
  ref: "Conversation",
  foreignField: "participants",
  localField: "_id",
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
  this.passwordConfirm = undefined;
});

userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;

  this.changedPasswordAt = Date.now() - 1000;
});

userSchema.methods.correctPassword = async function (clientPassword, password) {
  return await bcrypt.compare(clientPassword, password);
};

userSchema.methods.changedPasswordAfter = function (jWTIat) {
  if (this.changedPasswordAt) {
    const changedPasswordTime = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10,
    );

    return jWTIat < changedPasswordTime;
  }
  return false;
};

const User = mongoose.model("User", userSchema);
export default User;
