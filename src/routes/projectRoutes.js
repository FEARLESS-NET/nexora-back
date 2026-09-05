import express from "express";

import {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE PROJECT
// ==========================================

router.post(
  "/",
  protect,
  createProject
);

// ==========================================
// GET MY PROJECTS
// ==========================================

router.get(
  "/",
  protect,
  getMyProjects
);

// ==========================================
// GET ALL PROJECTS (PUBLIC)
// ==========================================

router.get(
  "/all",
  async (req, res) => {
    try {
      const Project = (await import("../models/projectModel.js")).default;

      const projects = await Project.find()
        .populate("owner", "name username avatar")
        .sort({ createdAt: -1 });

      // ==========================================
      // TRANSFORM PROJECTS
      // ==========================================

      const transformedProjects = projects.map((project) => {
        const projectData = project.toObject();

        return {
          ...projectData,

          // Owner information
          developerName: project.owner?.name || null,
          developerUsername: project.owner?.username || null,
          developerAvatar: project.owner?.avatar || null,
        };
      });

      res.json({
        success: true,
        projects: transformedProjects,
      });
    } catch (error) {
      console.error("Error fetching all projects:", error);

      res.status(500).json({
        success: false,
        message: "Error fetching projects",
      });
    }
  }
);

// ==========================================
// GET SINGLE PROJECT
// ==========================================

router.get(
  "/:id",
  protect,
  getProject
);

// ==========================================
// UPDATE PROJECT
// ==========================================

router.put(
  "/:id",
  protect,
  updateProject
);

// ==========================================
// DELETE PROJECT
// ==========================================

router.delete(
  "/:id",
  protect,
  deleteProject
);

export default router;