import express from "express";

import {
  register,
  login,
  getMe,
  changePassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
  register
);

// ==========================================
// LOGIN
// ==========================================

router.post(
  "/login",
  login
);

// ==========================================
// GET CURRENT USER
// ==========================================

router.get(
  "/me",
  protect,
  getMe
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put(
  "/change-password",
  protect,
  changePassword
);

export default router;