import express from "express";
import { getAllHashtag } from "../controllers/hashTagController.js";

const hashtagRouter = express.Router();

hashtagRouter.get("/allHashtags", getAllHashtag);

export default hashtagRouter;
