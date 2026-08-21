import Hashtag from "../models/hashTagModel.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllHashtag = catchAsync(async (req, res, next) => {
  const allHashtag = await Hashtag.find().sort("-postsCount");

  if (!allHashtag) {
    return next();
  }

  res.status(200).json({
    status: "Success",
    result: allHashtag.length,
    allHashtag,
  });
});
