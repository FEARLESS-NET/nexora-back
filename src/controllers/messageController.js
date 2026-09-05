import mongoose from "mongoose";

import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

import { getIO } from "../config/socket.js";

import uploadToImgBB from "../utils/uploadToImgBB.js";

// ==========================================
// HELPER
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// SEND MESSAGE
// TEXT + IMAGE
// ==========================================

export const sendMessage = async (
  req,
  res
) => {
  try {
    const {
      content,
      receiverId,
      proposalId,
    } = req.body;

    console.log("📨 SEND MESSAGE");
    console.log(
      "Sender:",
      req.user?.userId
    );
    console.log(
      "Receiver:",
      receiverId
    );

    // ======================================
    // AUTH
    // ======================================

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ======================================
    // VALIDATE RECEIVER
    // ======================================

    if (
      !receiverId ||
      !isValidObjectId(receiverId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid receiver is required",
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
        message:
          "You cannot send a message to yourself",
      });
    }

    // ======================================
    // GET RECEIVER
    // ======================================

    const receiver =
      await User.findById(
        receiverId
      );

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message:
          "Receiver not found",
      });
    }

    // ======================================
    // GET SENDER
    // ======================================

    const sender =
      await User.findById(
        req.user.userId
      );

    if (!sender) {
      return res.status(404).json({
        success: false,
        message:
          "Sender not found",
      });
    }

    // ======================================
    // CHECK BLOCK
    // ======================================

    const senderBlocked =
      sender.blockedUsers?.some(
        (id) =>
          id.toString() ===
          receiverId.toString()
      );

    if (senderBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "You blocked this user. Unblock them first.",
      });
    }

    const receiverBlocked =
      receiver.blockedUsers?.some(
        (id) =>
          id.toString() ===
          req.user.userId.toString()
      );

    if (receiverBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot send a message to this user.",
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
        "☁️ Uploading image..."
      );

      const uploaded =
        await uploadToImgBB(
          req.file.buffer
        );

      imageUrl =
        uploaded.url;

      imageDeleteUrl =
        uploaded.deleteUrl;

      console.log(
        "✅ Image uploaded:",
        imageUrl
      );
    }

    // ======================================
    // VALIDATE MESSAGE
    // ======================================

    if (
      !trimmedContent &&
      !imageUrl
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message cannot be empty",
      });
    }

    // ======================================
    // CREATE MESSAGE
    // ======================================

    const message =
      await Message.create({
        content:
          trimmedContent,

        imageUrl,

        imageDeleteUrl,

        sender:
          req.user.userId,

        receiver:
          receiverId,

        proposal:
          proposalId || null,
      });

    // ======================================
    // NOTIFICATION
    // ======================================

    try {
      await Notification.create({
        type: "new_message",

        title: "New message",

        content:
          `${sender.name} sent you a new message.`,

        recipient:
          receiverId,

        sender:
          req.user.userId,

        relatedMessage:
          message._id,

        proposal:
          proposalId || null,
      });
    } catch (error) {
      console.error(
        "❌ Notification error:",
        error
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

      io.to(
        `user:${receiverId}`
      ).emit(
        "new_message",
        populatedMessage
      );

      io.to(
        `user:${req.user.userId}`
      ).emit(
        "message_sent",
        populatedMessage
      );

    } catch (socketError) {
      console.error(
        "❌ Socket error:",
        socketError.message
      );
    }

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(201).json({
      success: true,
      message:
        populatedMessage,
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

    if (
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    // ======================================
    // CHECK IF CURRENT USER BLOCKED USER
    // ======================================

    const currentUser =
      await User.findById(
        req.user.userId
      ).select("blockedUsers");

    const isBlocked =
      currentUser?.blockedUsers?.some(
        (id) =>
          id.toString() ===
          userId.toString()
      );

    // Chat history still can be viewed
    // even if blocked.

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
    // MARK RECEIVED AS READ
    // ======================================

    await Message.updateMany(
      {
        sender:
          userId,

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

      isBlocked:
        Boolean(isBlocked),
    });

  } catch (error) {
    console.error(
      "❌ Get conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
};

// ==========================================
// GET MY CONVERSATIONS
// ==========================================

export const getMyConversations =
  async (
    req,
    res
  ) => {
    try {
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

      const conversations = {};

      const currentUserId =
        req.user.userId.toString();

      messages.forEach(
        (msg) => {
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

          if (
            !conversations[
              otherUserId
            ]
          ) {
            conversations[
              otherUserId
            ] = {
              user:
                otherUser,

              lastMessage:
                msg,

              unreadCount:
                0,
            };
          }

          if (
            receiverId ===
              currentUserId &&
            !msg.read
          ) {
            conversations[
              otherUserId
            ].unreadCount++;
          }
        }
      );

      const conversationList =
        Object.values(
          conversations
        );

      // ====================================
      // CHECK BLOCK STATUS
      // ====================================

      const currentUser =
        await User.findById(
          req.user.userId
        ).select(
          "blockedUsers"
        );

      const blockedIds =
        (
          currentUser?.blockedUsers ||
          []
        ).map((id) =>
          id.toString()
        );

      const result =
        conversationList.map(
          (chat) => ({
            ...chat,

            isBlocked:
              blockedIds.includes(
                chat.user._id.toString()
              ),
          })
        );

      return res.status(200).json({
        success: true,

        count:
          result.length,

        conversations:
          result,
      });

    } catch (error) {
      console.error(
        "❌ Get conversations error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  };



// ==========================================
// DELETE SINGLE OWN MESSAGE
// ==========================================

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const currentUserId = req.user.userId.toString();
    const senderId = message.sender.toString();
    const receiverId = message.receiver.toString();

    // ==========================================
    // FAQAT XABAR EGASI O'CHIRA OLADI
    // ==========================================

    if (senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // ==========================================
    // DELETE MESSAGE
    // ==========================================

    await Message.findByIdAndDelete(messageId);

    // ==========================================
    // DELETE RELATED NOTIFICATION
    // ==========================================

    try {
      await Notification.deleteMany({
        relatedMessage: message._id,
      });
    } catch (error) {
      console.error(
        "❌ Notification delete error:",
        error.message
      );
    }

    // ==========================================
    // SOCKET
    // ==========================================

    try {
      const io = getIO();

      // Sender
      io.to(`user:${senderId}`).emit(
        "message_deleted",
        {
          messageId: messageId.toString(),
        }
      );

      // Receiver
      io.to(`user:${receiverId}`).emit(
        "message_deleted",
        {
          messageId: messageId.toString(),
        }
      );
    } catch (error) {
      console.error(
        "❌ Socket delete error:",
        error.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      messageId,
    });
  } catch (error) {
    console.error(
      "❌ Delete message error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE SELECTED MESSAGES
// ==========================================


// ==========================================

export const deleteSelectedMessages = async (
  req,
  res
) => {
  try {
    const { messageIds } = req.body;

    // ==========================================
    // VALIDATE
    // ==========================================

    if (
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No messages selected",
      });
    }

    const validIds = messageIds.filter((id) =>
      isValidObjectId(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message IDs",
      });
    }

    const currentUserId =
      req.user.userId.toString();

    // ==========================================
    // FAQAT O'Z XABARLARINI TOPAMIZ
    // ==========================================

    const messages = await Message.find({
      _id: {
        $in: validIds,
      },

      sender: currentUserId,
    });

    if (messages.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    const ids = messages.map((msg) =>
      msg._id.toString()
    );

    // ==========================================
    // DELETE
    // ==========================================

    await Message.deleteMany({
      _id: {
        $in: ids,
      },

      sender: currentUserId,
    });

    // ==========================================
    // DELETE NOTIFICATIONS
    // ==========================================

    try {
      await Notification.deleteMany({
        relatedMessage: {
          $in: ids,
        },
      });
    } catch (error) {
      console.error(
        "❌ Notification delete error:",
        error.message
      );
    }

    // ==========================================
    // SOCKET
    // ==========================================

    try {
      const io = getIO();

      const affectedUsers = new Set();

      messages.forEach((msg) => {
        affectedUsers.add(
          msg.sender.toString()
        );

        affectedUsers.add(
          msg.receiver.toString()
        );
      });

      affectedUsers.forEach((userId) => {
        io.to(`user:${userId}`).emit(
          "messages_deleted",
          {
            messageIds: ids,
          }
        );
      });
    } catch (error) {
      console.error(
        "❌ Socket selected delete error:",
        error.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Selected messages deleted successfully",
      deletedCount: ids.length,
      messageIds: ids,
    });
  } catch (error) {
    console.error(
      "❌ Delete selected messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// ==========================================
// DELETE ENTIRE CONVERSATION
// ==========================================

export const deleteConversation =
  async (
    req,
    res
  ) => {
    try {
      const {
        userId,
      } = req.params;

      if (
        !isValidObjectId(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      const currentUser =
        req.user.userId.toString();

      // ====================================
      // FIND MESSAGES
      // ====================================

      const messages =
        await Message.find({
          $or: [
            {
              sender:
                currentUser,

              receiver:
                userId,
            },

            {
              sender:
                userId,

              receiver:
                currentUser,
            },
          ],
        }).select("_id");

      const messageIds =
        messages.map(
          (msg) =>
            msg._id
        );

      // ====================================
      // DELETE MESSAGES
      // ====================================

      if (
        messageIds.length > 0
      ) {
        await Message.deleteMany({
          _id: {
            $in: messageIds,
          },
        });
      }

      // ====================================
      // DELETE NOTIFICATIONS
      // ====================================

      try {
        if (
          messageIds.length > 0
        ) {
          await Notification.deleteMany({
            relatedMessage: {
              $in: messageIds,
            },
          });
        }
      } catch (error) {
        console.error(
          "Notification delete error:",
          error
        );
      }

      // ====================================
      // SOCKET
      // ====================================

      try {
        const io = getIO();

        io.to(
          `user:${currentUser}`
        ).emit(
          "conversation_deleted",
          {
            userId,
          }
        );

        io.to(
          `user:${userId}`
        ).emit(
          "conversation_deleted",
          {
            userId:
              currentUser,
          }
        );

      } catch (error) {
        console.error(
          "Socket conversation delete error:",
          error.message
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Conversation deleted successfully",

        deletedCount:
          messageIds.length,
      });

    } catch (error) {
      console.error(
        "❌ Delete conversation error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  };

// ==========================================
// BLOCK USER
// ==========================================

export const blockUser = async (
  req,
  res
) => {
  try {
    const {
      userId,
    } = req.params;

    if (
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    if (
      userId.toString() ===
      req.user.userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot block yourself",
      });
    }

    const user =
      await User.findById(
        req.user.userId
      );

    const targetUser =
      await User.findById(
        userId
      );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ====================================
    // ALREADY BLOCKED
    // ====================================

    const alreadyBlocked =
      user.blockedUsers?.some(
        (id) =>
          id.toString() ===
          userId.toString()
      );

    if (!alreadyBlocked) {
      user.blockedUsers.push(
        userId
      );

      await user.save();
    }

    // ====================================
    // SOCKET
    // ====================================

    try {
      const io = getIO();

      io.to(
        `user:${req.user.userId}`
      ).emit(
        "user_blocked",
        {
          userId,
        }
      );

    } catch (error) {
      console.error(
        "Socket block error:",
        error.message
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "User blocked successfully",

      userId,
    });

  } catch (error) {
    console.error(
      "❌ Block user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
};

// ==========================================
// UNBLOCK USER
// ==========================================

export const unblockUser = async (
  req,
  res
) => {
  try {
    const {
      userId,
    } = req.params;

    if (
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    const user =
      await User.findById(
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    user.blockedUsers =
      (
        user.blockedUsers || []
      ).filter(
        (id) =>
          id.toString() !==
          userId.toString()
      );

    await user.save();

    // ====================================
    // SOCKET
    // ====================================

    try {
      const io = getIO();

      io.to(
        `user:${req.user.userId}`
      ).emit(
        "user_unblocked",
        {
          userId,
        }
      );

    } catch (error) {
      console.error(
        "Socket unblock error:",
        error.message
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "User unblocked successfully",

      userId,
    });

  } catch (error) {
    console.error(
      "❌ Unblock user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
};

// ==========================================
// GET BLOCKED USERS
// ==========================================

export const getBlockedUsers =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        )
          .populate(
            "blockedUsers",
            "name username avatar"
          )
          .select(
            "blockedUsers"
          );

      return res.status(200).json({
        success: true,

        blockedUsers:
          user?.blockedUsers ||
          [],
      });

    } catch (error) {
      console.error(
        "❌ Get blocked users error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error",
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
    const {
      messageId,
    } = req.params;

    if (
      !isValidObjectId(
        messageId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid message ID",
      });
    }

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

    if (
      message.receiver.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied",
      });
    }

    message.read = true;

    await message.save();

    // ====================================
    // SOCKET
    // ====================================

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

    } catch (error) {
      console.error(
        "❌ Socket read error:",
        error.message
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "Message marked as read",
    });

  } catch (error) {
    console.error(
      "❌ Mark read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
};