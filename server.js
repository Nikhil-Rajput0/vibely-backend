import dotenv from "dotenv/config";
import app from "./app.js";
import mongoose from "mongoose";
import "./jobs/storyCleanup.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket/socket.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http:localhost:3000"],
    credentials: true,
  },
});

socketHandler(io);

const db = process.env.DATABASE.replace(
  "<DB_PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => console.log("DB connection error:", err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
