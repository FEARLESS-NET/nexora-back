import express from "express";

import {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,

  // DELETE
  deleteMessage,
  deleteSelectedMessages,
  deleteConversation,

  // BLOCK
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/messageController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../config/multer.js";

const router = express.Router();

// ==========================================
// SEND MESSAGE
// TEXT + IMAGE
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
// GET BLOCKED USERS
// ==========================================

router.get(
  "/blocked",
  protect,
  getBlockedUsers
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
// DELETE ENTIRE CONVERSATION
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
  "/selected",
  protect,
  deleteSelectedMessages
);

// ==========================================
// BLOCK USER
// ==========================================

router.post(
  "/block/:userId",
  protect,
  blockUser
);

// ==========================================
// UNBLOCK USER
// ==========================================

router.delete(
  "/block/:userId",
  protect,
  unblockUser
);

// ==========================================
// DELETE SINGLE MESSAGE
// ==========================================

router.delete(
  "/:messageId",
  protect,
  deleteMessage
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