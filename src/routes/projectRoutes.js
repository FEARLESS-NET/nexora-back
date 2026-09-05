import express from "express";

import {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import Project from "../models/projectModel.js";

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
// GET ALL PROJECTS - PUBLIC
// ==========================================

router.get(
  "/all",
  async (req, res) => {
    try {
      const projects = await Project.find()
        .populate("owner", "name username avatar role")
        .sort({ createdAt: -1 });

      const transformedProjects = projects.map((project) => {
        const projectData = project.toObject();

        const owner = project.owner;

        return {
          ...projectData,

          // ==========================================
          // OWNER INFORMATION
          // ==========================================

          ownerId: owner?._id || null,
          ownerRole: owner?.role || null,

          // Developer
          developerId:
            owner?.role === "developer"
              ? owner._id
              : null,

          developerName:
            owner?.role === "developer"
              ? owner.name
              : null,

          developerUsername:
            owner?.role === "developer"
              ? owner.username
              : null,

          developerAvatar:
            owner?.role === "developer"
              ? owner.avatar
              : null,

          // Company
          companyId:
            owner?.role === "company"
              ? owner._id
              : null,

          companyName:
            owner?.role === "company"
              ? owner.name
              : null,

          companyUsername:
            owner?.role === "company"
              ? owner.username
              : null,

          companyAvatar:
            owner?.role === "company"
              ? owner.avatar
              : null,
        };
      });

      return res.status(200).json({
        success: true,
        count: transformedProjects.length,
        projects: transformedProjects,
      });
    } catch (error) {
      console.error(
        "❌ Error fetching all projects:",
        error
      );

      return res.status(500).json({
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