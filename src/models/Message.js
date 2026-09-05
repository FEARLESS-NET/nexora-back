import express from "express";

import {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,

  deleteMessage,
  deleteSelectedMessages,
  deleteConversation,

  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// ==========================================
// SEND MESSAGE
// ==========================================

router.post(
  "/",
  protect,
  upload.single("image"),
  sendMessage
);

// ==========================================
// CONVERSATIONS
// ==========================================

router.get(
  "/conversations",
  protect,
  getMyConversations
);

router.get(
  "/conversation/:userId",
  protect,
  getConversation
);

// ==========================================
// DELETE WHOLE CHAT
// ==========================================

router.delete(
  "/conversation/:userId",
  protect,
  deleteConversation
);

// ==========================================
// DELETE SELECTED MESSAGES
// ==========================================

router.delete(
  "/bulk",
  protect,
  deleteSelectedMessages
);

// ==========================================
// DELETE ONE OWN MESSAGE
// ==========================================

router.delete(
  "/:messageId",
  protect,
  deleteMessage
);

// ==========================================
// BLOCK
// ==========================================

router.post(
  "/block/:userId",
  protect,
  blockUser
);

router.delete(
  "/block/:userId",
  protect,
  unblockUser
);

router.get(
  "/blocked",
  protect,
  getBlockedUsers
);

// ==========================================
// READ
// ==========================================

router.put(
  "/:messageId/read",
  protect,
  markAsRead
);

export default router;