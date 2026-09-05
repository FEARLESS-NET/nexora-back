import express from "express";

import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllProjects,
  deleteProject,
  getAllProposals,
} from "../controllers/adminController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize("admin"));

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", getDashboardStats);

// ==========================================
// USERS MANAGEMENT
// ==========================================

router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);

// ==========================================
// PROJECTS MANAGEMENT
// ==========================================

router.get("/projects", getAllProjects);
router.delete("/projects/:projectId", deleteProject);

// ==========================================
// PROPOSALS MANAGEMENT
// ==========================================

router.get("/proposals", getAllProposals);

export default router;