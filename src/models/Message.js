import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // ==========================================
    // MESSAGE CONTENT
    // ==========================================

    content: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // IMAGE URL
    // ==========================================

    imageUrl: {
      type: String,
      default: null,
    },

    // ==========================================
    // IMGBB DELETE URL
    // ==========================================

    imageDeleteUrl: {
      type: String,
      default: null,
    },

    // ==========================================
    // SENDER
    // ==========================================

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // RECEIVER
    // ==========================================

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // READ STATUS
    // ==========================================

    read: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // PROPOSAL
    // ==========================================

    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// VALIDATE MESSAGE
// ==========================================
//
// Message kamida:
// 1. text
// yoki
// 2. image
//
// bo'lishi kerak.
//
// MUHIM:
// next() ishlatilmaydi.
// ==========================================

messageSchema.pre(
  "validate",
  function () {
    const hasContent =
      typeof this.content === "string" &&
      this.content.trim().length > 0;

    const hasImage =
      Boolean(this.imageUrl);

    if (!hasContent && !hasImage) {
      throw new Error(
        "Message must contain text or image"
      );
    }
  }
);

// ==========================================
// MODEL
// ==========================================

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;