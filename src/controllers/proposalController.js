import mongoose from "mongoose";

import Proposal from "../models/Proposal.js";
import User from "../models/User.js";

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

    if (!title || !description || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and receiver are required",
      });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // Verify receiver is a developer
    if (receiver.role !== "developer") {
      return res.status(400).json({
        success: false,
        message: "Can only send proposals to developers",
      });
    }

    const proposal = await Proposal.create({
      title: title.trim(),
      description: description.trim(),
      budget: budget?.trim() || "",
      duration: duration?.trim() || "",
      sender: req.user.userId,
      receiver: receiverId,
      project: projectId || null,
    });

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
// GET MY PROPOSALS (SENT & RECEIVED)
// ==========================================

export const getMyProposals = async (req, res) => {
  try {
    const { type } = req.query; // 'sent' or 'received'

    let proposals;

    if (type === "sent") {
      // Proposals I sent
      proposals = await Proposal.find({
        sender: req.user.userId,
      })
        .populate("receiver", "name username avatar")
        .populate("project", "title")
        .sort({ createdAt: -1 });
    } else if (type === "received") {
      // Proposals I received
      proposals = await Proposal.find({
        receiver: req.user.userId,
      })
        .populate("sender", "name username avatar")
        .populate("project", "title")
        .sort({ createdAt: -1 });
    } else {
      // All proposals involving me
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

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

    // Check if user is involved in this proposal
    if (
      proposal.sender._id.toString() !== req.user.userId &&
      proposal.receiver._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // Only receiver can accept
    if (proposal.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can accept this proposal",
      });
    }

    if (proposal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Proposal is not pending",
      });
    }

    proposal.status = "Accepted";
    await proposal.save();

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID",
      });
    }

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // Only receiver can reject
    if (proposal.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can reject this proposal",
      });
    }

    if (proposal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Proposal is not pending",
      });
    }

    proposal.status = "Rejected";
    await proposal.save();

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