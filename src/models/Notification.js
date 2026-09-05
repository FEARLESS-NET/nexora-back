import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "proposal_received",
        "proposal_accepted",
        "proposal_rejected",
        "new_message",
        "project_view",
        "profile_view",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    read: {
      type: Boolean,
      default: false,
    },

    // Link to related data
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
    },

    relatedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;