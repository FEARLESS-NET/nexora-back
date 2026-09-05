import mongoose from "mongoose";

import Proposal from "../models/Proposal.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// ==========================================
// CREATE PROPOSAL
// ==========================================

export const createProposal = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      duration,
      receiverId,
      projectId,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!title || !description || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and receiver are required",
      });
    }

    // ==========================================
    // VERIFY RECEIVER
    // ==========================================

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // ==========================================
    // RECEIVER MUST BE DEVELOPER
    // ==========================================

    if (receiver.role !== "developer") {
      return res.status(400).json({
        success: false,
        message: "Can only send proposals to developers",
      });
    }

    // ==========================================
    // VERIFY SENDER
    // ==========================================

    const sender = await User.findById(req.user.userId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    // ==========================================
    // CREATE PROPOSAL
    // ==========================================

    const proposal = await Proposal.create({
      title: title.trim(),
      description: description.trim(),
      budget: budget?.trim() || "",
      duration: duration?.trim() || "",
      sender: req.user.userId,
      receiver: receiverId,
      project: projectId || null,
    });

    // ==========================================
    // CREATE NOTIFICATION
    // ==========================================

    await Notification.create({
      type: "proposal_received",
      title: "New proposal received",
      content: `${sender.name} sent you a new proposal.`,
      recipient: receiverId,
      sender: req.user.userId,
      proposal: proposal._id,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Proposal sent successfully",
      proposal,
    });
  } catch (error) {
    console.error("Create proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY PROPOSALS
// SENT & RECEIVED
// ==========================================

export const getMyProposals = async (req, res) => {
  try {
    const { type } = req.query;

    let proposals;

    // ==========================================
    // SENT PROPOSALS
    // ==========================================

    if (type === "sent") {
      proposals = await Proposal.find({
        sender: req.user.userId,
      })
        .populate("receiver", "name username avatar")
        .populate("project", "title")
        .sort({ createdAt: -1 });
    }

    // ==========================================
    // RECEIVED PROPOSALS
    // ==========================================

    else if (type === "received") {
      proposals = await Proposal.find({
        receiver: req.user.userId,
      })
        .populate("sender", "name username avatar")
        .populate("project", "title")
        .sort({ createdAt: -1 });
    }

    // ==========================================
    // ALL PROPOSALS
    // ==========================================

    else {
      proposals = await Proposal.find({
        $or: [
          { sender: req.user.userId },
          { receiver: req.user.userId },
        ],
      })
        .populate("sender", "name username avatar")
        .populate("receiver", "name username avatar")
        .populate("project", "title")
        .sort({ createdAt: -1 });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    console.error("Get proposals error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET PROPOSAL BY ID
// ==========================================

export const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    // ==========================================
    // FIND PROPOSAL
    // ==========================================

    const proposal = await Proposal.findById(id)
      .populate("sender", "name username avatar")
      .populate("receiver", "name username avatar")
      .populate("project", "title");

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // ==========================================
    // CHECK ACCESS
    // ==========================================

    if (
      proposal.sender._id.toString() !== req.user.userId &&
      proposal.receiver._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      proposal,
    });
  } catch (error) {
    console.error("Get proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ACCEPT PROPOSAL
// ==========================================

export const acceptProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    // ==========================================
    // FIND PROPOSAL
    // ==========================================

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // ==========================================
    // ONLY RECEIVER CAN ACCEPT
    // ==========================================

    if (proposal.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can accept this proposal",
      });
    }

    // ==========================================
    // CHECK STATUS
    // ==========================================

    if (proposal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Proposal is not pending",
      });
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    proposal.status = "Accepted";

    await proposal.save();

    // ==========================================
    // CREATE ACCEPT NOTIFICATION
    // ==========================================

    await Notification.create({
      type: "proposal_accepted",
      title: "Proposal accepted",
      content: "Your proposal has been accepted.",
      recipient: proposal.sender,
      sender: req.user.userId,
      proposal: proposal._id,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Proposal accepted successfully",
      proposal,
    });
  } catch (error) {
    console.error("Accept proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// REJECT PROPOSAL
// ==========================================

export const rejectProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    // ==========================================
    // FIND PROPOSAL
    // ==========================================

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // ==========================================
    // ONLY RECEIVER CAN REJECT
    // ==========================================

    if (proposal.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can reject this proposal",
      });
    }

    // ==========================================
    // CHECK STATUS
    // ==========================================

    if (proposal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Proposal is not pending",
      });
    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    proposal.status = "Rejected";

    await proposal.save();

    // ==========================================
    // CREATE REJECT NOTIFICATION
    // ==========================================

    await Notification.create({
      type: "proposal_rejected",
      title: "Proposal rejected",
      content: "Your proposal has been rejected.",
      recipient: proposal.sender,
      sender: req.user.userId,
      proposal: proposal._id,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Proposal rejected successfully",
      proposal,
    });
  } catch (error) {
    console.error("Reject proposal error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};