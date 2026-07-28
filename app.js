import express from "express";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/globalErrorController.js";
import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";
import commentRouter from "./routes/commentRouter.js";
import storyRouter from "./routes/storyRouter.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welome to the backend of Vibely. Thanks for visting!");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/comments", commentRouter);

app.use((req, res, next) => {
  return next(new AppError("These route does not exist", 404));
});

app.use(globalErrorHandler);

export default app;
