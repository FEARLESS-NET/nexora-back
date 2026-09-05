import mongoose from "mongoose";

import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

import User from "../models/User.js";

import { getIO } from "../config/socket.js";

import uploadToImgBB from "../utils/uploadToImgBB.js";

// ==========================================
// SEND MESSAGE
// TEXT + IMAGE
// ==========================================

export const sendMessage = async (req, res) => {
  try {
    const {
      content,
      receiverId,
      proposalId,
    } = req.body;

    // ======================================
    // DEBUG
    // ======================================

    console.log("📨 SEND MESSAGE");
    console.log("Sender:", req.user?.userId);
    console.log("Receiver:", receiverId);
    console.log("Content:", content);

    console.log(
      "File:",
      req.file
        ? {
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
          }
        : "No image"
    );

    // ======================================
    // CHECK AUTH
    // ======================================

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ======================================
    // VALIDATE RECEIVER
    // ======================================

    if (
      !receiverId ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid receiver is required",
      });
    }

    // ======================================
    // PREVENT SELF MESSAGE
    // ======================================

    if (
      receiverId.toString() ===
      req.user.userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a message to yourself",
      });
    }

    // ======================================
    // VERIFY RECEIVER EXISTS
    // ======================================

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // ======================================
    // GET SENDER
    // ======================================

    const sender = await User.findById(
      req.user.userId
    );

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    // ======================================
    // TEXT
    // ======================================

    const trimmedContent =
      typeof content === "string"
        ? content.trim()
        : "";

    // ======================================
    // IMAGE
    // ======================================

    let imageUrl = null;
    let imageDeleteUrl = null;

    if (req.file) {
      console.log(
        "☁️ Uploading image to ImgBB..."
      );

      const uploaded =
        await uploadToImgBB(
          req.file.buffer
        );

      imageUrl = uploaded.url;
      imageDeleteUrl = uploaded.deleteUrl;

      console.log(
        "✅ ImgBB uploaded:",
        imageUrl
      );
    }

    // ======================================
    // MUST HAVE TEXT OR IMAGE
    // ======================================

    if (
      !trimmedContent &&
      !imageUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // ======================================
    // CREATE MESSAGE
    // ======================================

    const message =
      await Message.create({
        content: trimmedContent,

        imageUrl,

        imageDeleteUrl,

        sender: req.user.userId,

        receiver: receiverId,

        proposal:
          proposalId || null,
      });

    console.log(
      "✅ Message created:",
      message._id
    );

    // ======================================
    // CREATE NOTIFICATION
    // ======================================

    try {
      await Notification.create({
        type: "new_message",

        title: "New message",

        content: `${sender.name} sent you a new message.`,

        recipient: receiverId,

        sender: req.user.userId,

        relatedMessage: message._id,

        proposal:
          proposalId || null,
      });

      console.log(
        "🔔 Message notification created"
      );
    } catch (notificationError) {
      // Notification xatosi message yuborilishini
      // to'xtatmasligi kerak.

      console.error(
        "❌ Message notification error:",
        notificationError
      );
    }

    // ======================================
    // POPULATE
    // ======================================

    const populatedMessage =
      await Message.findById(
        message._id
      )
        .populate(
          "sender",
          "name username avatar"
        )
        .populate(
          "receiver",
          "name username avatar"
        );

    // ======================================
    // SOCKET
    // ======================================

    try {
      const io = getIO();

      // ====================================
      // SEND TO RECEIVER
      // ====================================

      io.to(
        `user:${receiverId}`
      ).emit(
        "new_message",
        populatedMessage
      );

      // ====================================
      // SEND BACK TO SENDER
      // ====================================

      io.to(
        `user:${req.user.userId}`
      ).emit(
        "message_sent",
        populatedMessage
      );

      console.log(
        "🟢 Socket message emitted"
      );

    } catch (socketError) {
      console.error(
        "❌ Socket emit error:",
        socketError.message
      );
    }

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });

  } catch (error) {
    console.error(
      "❌ Send message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error",
    });
  }
};

// ==========================================
// GET CONVERSATION
// ==========================================

export const getConversation = async (
  req,
  res
) => {
  try {
    const { userId } =
      req.params;

    // ======================================
    // VALIDATE USER
    // ======================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ======================================
    // GET MESSAGES
    // ======================================

    const messages =
      await Message.find({
        $or: [
          {
            sender:
              req.user.userId,

            receiver:
              userId,
          },

          {
            sender:
              userId,

            receiver:
              req.user.userId,
          },
        ],
      })
        .populate(
          "sender",
          "name username avatar"
        )
        .populate(
          "receiver",
          "name username avatar"
        )
        .sort({
          createdAt: 1,
        });

    // ======================================
    // MARK RECEIVED MESSAGES AS READ
    // ======================================

    await Message.updateMany(
      {
        sender: userId,

        receiver:
          req.user.userId,

        read: false,
      },

      {
        read: true,
      }
    );

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,

      count:
        messages.length,

      messages,
    });

  } catch (error) {
    console.error(
      "❌ Get conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY CONVERSATIONS
// ==========================================

export const getMyConversations = async (
  req,
  res
) => {
  try {
    // ======================================
    // GET ALL USER MESSAGES
    // ======================================

    const messages =
      await Message.find({
        $or: [
          {
            sender:
              req.user.userId,
          },

          {
            receiver:
              req.user.userId,
          },
        ],
      })
        .populate(
          "sender",
          "name username avatar"
        )
        .populate(
          "receiver",
          "name username avatar"
        )
        .sort({
          createdAt: -1,
        });

    // ======================================
    // BUILD CONVERSATIONS
    // ======================================

    const conversations = {};

    const currentUserId =
      req.user.userId.toString();

    messages.forEach((msg) => {
      if (
        !msg.sender ||
        !msg.receiver
      ) {
        return;
      }

      const senderId =
        msg.sender._id.toString();

      const receiverId =
        msg.receiver._id.toString();

      const otherUserId =
        senderId === currentUserId
          ? receiverId
          : senderId;

      const otherUser =
        senderId === currentUserId
          ? msg.receiver
          : msg.sender;

      // ====================================
      // CREATE CONVERSATION
      // ====================================

      if (
        !conversations[
          otherUserId
        ]
      ) {
        conversations[
          otherUserId
        ] = {
          user: otherUser,

          lastMessage: msg,

          unreadCount: 0,
        };
      }

      // ====================================
      // UNREAD
      // ====================================

      if (
        receiverId ===
          currentUserId &&
        !msg.read
      ) {
        conversations[
          otherUserId
        ].unreadCount++;
      }
    });

    // ======================================
    // RESPONSE
    // ======================================

    const conversationList =
      Object.values(
        conversations
      );

    return res.status(200).json({
      success: true,

      count:
        conversationList.length,

      conversations:
        conversationList,
    });

  } catch (error) {
    console.error(
      "❌ Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// MARK MESSAGE AS READ
// ==========================================

export const markAsRead = async (
  req,
  res
) => {
  try {
    const { messageId } =
      req.params;

    // ======================================
    // VALIDATE ID
    // ======================================

    if (
      !mongoose.Types.ObjectId.isValid(
        messageId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid message ID",
      });
    }

    // ======================================
    // FIND MESSAGE
    // ======================================

    const message =
      await Message.findById(
        messageId
      );

    if (!message) {
      return res.status(404).json({
        success: false,
        message:
          "Message not found",
      });
    }

    // ======================================
    // CHECK RECEIVER
    // ======================================

    if (
      message.receiver.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // ======================================
    // MARK READ
    // ======================================

    message.read = true;

    await message.save();

    // ======================================
    // SOCKET
    // ======================================

    try {
      const io = getIO();

      io.to(
        `user:${message.sender.toString()}`
      ).emit(
        "message_read",
        {
          messageId:
            message._id.toString(),

          readBy:
            req.user.userId.toString(),
        }
      );

    } catch (socketError) {
      console.error(
        "❌ Socket read event error:",
        socketError.message
      );
    }

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,
      message:
        "Message marked as read",
    });

  } catch (error) {
    console.error(
      "❌ Mark as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};