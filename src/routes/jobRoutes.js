import express from "express";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE JOB POSTING
// ==========================================

router.post("/", protect, async (req, res) => {
  try {
    const { title, description, type, salary, location, requirements, expiryDate, companyId } = req.body;

    // Verify company belongs to user
    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to post jobs for this company" });
    }

    const job = await Job.create({
      title,
      description,
      type,
      salary,
      location,
      requirements,
      expiryDate,
      company: companyId,
      postedBy: req.user._id,
    });

    // Update company's open jobs count
    await Company.findByIdAndUpdate(companyId, {
      $inc: { openJobs: 1 }
    });

    res.status(201).json({ job });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Error creating job posting" });
  }
});

// ==========================================
// GET JOBS BY COMPANY ID
// ==========================================

router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const jobs = await Job.find({ 
      company: companyId, 
      isActive: true 
    }).sort({ postedDate: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// ==========================================
// GET ALL ACTIVE JOBS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ 
      isActive: true,
      expiryDate: { $gt: new Date() }
    })
    .populate('company', 'name logo location')
    .sort({ postedDate: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// ==========================================
// GET JOB BY ID
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo location description website banner');

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Error fetching job" });
  }
});

// ==========================================
// UPDATE JOB
// ==========================================

router.put("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ job: updatedJob });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Error updating job" });
  }
});

// ==========================================
// DELETE JOB
// ==========================================

router.delete("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Update company's open jobs count
    await Company.findByIdAndUpdate(job.company, {
      $inc: { openJobs: -1 }
    });

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Error deleting job" });
  }
});

export default router;