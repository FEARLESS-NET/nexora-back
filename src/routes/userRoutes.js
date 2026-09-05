import express from "express";

import {
  updateProfile,
  deleteMyAccount,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../config/multer.js";

const router = express.Router();

// ==========================================
// UPDATE PROFILE
// ==========================================

router.put(
  "/profile",
  protect,
  upload.single("avatar"),
  updateProfile
);

// ==========================================
// DELETE MY ACCOUNT
// ==========================================

router.delete(
  "/account",
  protect,
  deleteMyAccount
);

export default router;