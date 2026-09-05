import mongoose from "mongoose";

import Notification from "../models/Notification.js";

// ==========================================
// CREATE NOTIFICATION
// ==========================================

export const createNotification = async (req, res) => {
  try {
    const { type, title, content, recipientId, senderId, proposalId, relatedMessageId } = req.body;

    if (!type || !title || !content || !recipientId) {
      return res.status(400).json({
        success: false,
        message: "Type, title, content, and recipient are required",
      });
    }

    const notification = await Notification.create({
      type,
      title,
      content,
      recipient: recipientId,
      sender: senderId || null,
      proposal: proposalId || null,
      relatedMessage: relatedMessageId || null,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name username avatar")
      .populate("recipient", "name username");

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: populatedNotification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.userId,
    })
      .populate("sender", "name username avatar")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// MARK AS READ
// ==========================================

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only recipient can mark as read
    if (notification.recipient.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.userId,
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only recipient can delete
    if (notification.recipient.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};