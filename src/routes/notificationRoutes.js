import express from "express";

import {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE NOTIFICATION (INTERNAL/ADMIN)
// ==========================================

router.post("/", protect, authorize("admin"), createNotification);

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

router.get("/", protect, getMyNotifications);

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================

router.put("/:notificationId/read", protect, markAsRead);

// ==========================================
// MARK ALL AS READ
// ==========================================

router.put("/read/all", protect, markAllAsRead);

// ==========================================
// DELETE NOTIFICATION
// ==========================================

router.delete("/:notificationId", protect, deleteNotification);

export default router;