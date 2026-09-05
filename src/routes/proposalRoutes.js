import express from "express";

import {
  createProposal,
  getMyProposals,
  getProposalById,
  acceptProposal,
  rejectProposal,
} from "../controllers/proposalController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE PROPOSAL
// ==========================================

router.post("/", protect, createProposal);

// ==========================================
// GET MY PROPOSALS
// ==========================================

router.get("/", protect, getMyProposals);

// ==========================================
// GET PROPOSAL BY ID
// ==========================================

router.get("/:id", protect, getProposalById);

// ==========================================
// ACCEPT PROPOSAL
// ==========================================

router.put("/:id/accept", protect, acceptProposal);

// ==========================================
// REJECT PROPOSAL
// ==========================================

router.put("/:id/reject", protect, rejectProposal);

export default router;