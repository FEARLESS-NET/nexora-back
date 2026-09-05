import express from "express";

import {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../config/multer.js";

const router = express.Router();

// ==========================================
// SEND MESSAGE
// Supports:
// - text
// - image
// ==========================================

router.post(
  "/",
  protect,
  upload.single("image"),
  sendMessage
);

// ==========================================
// GET MY CONVERSATIONS
// ==========================================

router.get(
  "/conversations",
  protect,
  getMyConversations
);

// ==========================================
// GET CONVERSATION
// ==========================================

router.get(
  "/conversation/:userId",
  protect,
  getConversation
);

// ==========================================
// MARK MESSAGE AS READ
// ==========================================

router.put(
  "/:messageId/read",
  protect,
  markAsRead
);

export default router;