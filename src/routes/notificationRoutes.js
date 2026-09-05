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
// CREATE NOTIFICATION
// ==========================================

router.post(
  "/",
  protect,
  authorize("admin"),
  createNotification
);

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

router.get(
  "/",
  protect,
  getMyNotifications
);

// ==========================================
// MARK ALL AS READ
// MUHIM: specific route oldinda
// ==========================================

router.put(
  "/read/all",
  protect,
  markAllAsRead
);

// ==========================================
// MARK ONE AS READ
// ==========================================

router.put(
  "/:notificationId/read",
  protect,
  markAsRead
);

// ==========================================
// DELETE NOTIFICATION
// ==========================================

router.delete(
  "/:notificationId",
  protect,
  deleteNotification
);

export default router;