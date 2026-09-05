import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      trim: true,
      default: "",
    },

    imageUrl: {
      type: String,
      default: null,
    },

    imageDeleteUrl: {
      type: String,
      default: null,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

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

// Message text yoki image bo'lishi kerak
messageSchema.pre("validate", function () {
  const hasContent =
    typeof this.content === "string" &&
    this.content.trim().length > 0;

  const hasImage = Boolean(this.imageUrl);

  if (!hasContent && !hasImage) {
    throw new Error(
      "Message must contain text or image"
    );
  }
});

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;