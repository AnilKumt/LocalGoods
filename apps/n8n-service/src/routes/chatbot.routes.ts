import express, { Router } from "express";
import { chatWithBot } from "../controllers/chatbot.controller";

const router: Router = express.Router();

router.post("/chat", chatWithBot);

export default router;

