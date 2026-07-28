import dotenv from "dotenv/config";
import app from "./app.js";
import mongoose from "mongoose";
import "./jobs/storyCleanup.js";

const db = process.env.DATABASE.replace(
  "<DB_PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => console.log("DB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
