import express from "express";

import {
  createCompanyProfile,
  getMyCompanyProfile,
  updateCompanyProfile,
  getCompanies,
  getCompanyById,
} from "../controllers/companyController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE COMPANY PROFILE
// ==========================================

router.post("/", protect, createCompanyProfile);

// ==========================================
// GET MY COMPANY PROFILE
// ==========================================

router.get("/my", protect, getMyCompanyProfile);

// ==========================================
// UPDATE COMPANY PROFILE
// ==========================================

router.put("/my", protect, updateCompanyProfile);

// ==========================================
// GET ALL COMPANIES (PUBLIC)
// ==========================================

router.get("/", getCompanies);

// ==========================================
// GET COMPANY BY ID (PUBLIC)
// ==========================================

router.get("/:id", getCompanyById);

// ==========================================
// GET JOBS BY COMPANY ID
// ==========================================

router.get("/:id/jobs", async (req, res) => {
  try {
    const Job = (await import("../models/Job.js")).default;
    const jobs = await Job.find({ 
      company: req.params.id, 
      isActive: true 
    }).sort({ postedDate: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

export default router;