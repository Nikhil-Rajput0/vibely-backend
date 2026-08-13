import express from "express";
import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/globalErrorController.js";
import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";
import storyRouter from "./routes/storyRouter.js";
import hashtagRouter from "./routes/hashtagRouter.js";
import conversationRouter from "./routes/conversationRouter.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";

const app = express();
app.use(express.json());
app.use(cookieParser());

const corsOption = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.get("/", (req, res) => {
  res.send("Welome to the backend of Vibely. Thanks for visting!");
});

app.use(cors(corsOption));
app.use(helmet());
app.use(hpp());
app.use(compression());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/hashtags", hashtagRouter);

app.use((req, res, next) => {
  return next(new AppError("These route does not exist", 404));
});

app.use(globalErrorHandler);

export default app;
