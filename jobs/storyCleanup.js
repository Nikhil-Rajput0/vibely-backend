import cron from "node-cron";
import Story from "../models/storyModel.js";
import cloudinary from "../utils/cloudinary.js";

const deleteExpiredStories = async () => {
  try {
    const stories = await Story.find({
      expiredAt: {
        $lte: new Date(),
      },
    });

    for (const story of stories) {
      await cloudinary.uploader.destroy(story.cloudinaryId, {
        resource_type: story.type,
      });

      await Story.findByIdAndDelete(story._id);
    }

    console.log(`Deleted ${stories.length} expired stories`);
  } catch (err) {
    console.log(err);
  }
};

cron.schedule("*/10 * * * *", () => {
  console.log("Checking expired stories...");
  deleteExpiredStories();
});

export default deleteExpiredStories;
