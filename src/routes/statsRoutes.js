import express from "express";
import { getPlatformStats, getRecentActivity } from "../controllers/statsController.js";

const router = express.Router();

// Get platform statistics
router.get("/platform", getPlatformStats);

// Get recent activity
router.get("/activity", getRecentActivity);

export default router;