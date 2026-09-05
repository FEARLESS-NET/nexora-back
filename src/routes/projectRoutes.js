import express from "express";

import {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
  likeProject,
  unlikeProject,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/projectController.js";

import { protect } from "../middleware/authMiddleware.js";

import Project from "../models/projectModel.js";

const router = express.Router();

// ==========================================
// CREATE
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
// GET ALL PROJECTS PUBLIC
// ==========================================

router.get(
  "/all",
  async (req, res) => {
    try {
      const projects =
        await Project.find()
          .populate(
            "owner",
            "name username avatar role"
          )
          .sort({
            createdAt: -1,
          });

      const transformedProjects =
        projects.map((project) => {
          const projectData =
            project.toObject();

          const owner =
            project.owner;

          return {
            ...projectData,

            ownerId:
              owner?._id || null,

            ownerRole:
              owner?.role || null,

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

            // ❤️ REAL LIKE COUNT
            likes:
              project.likedBy?.length || 0,

            // 💬 REAL COMMENT COUNT
            comments:
              awaitProjectCommentsCount(
                project._id
              ),
          };
        });

      const finalProjects =
        await Promise.all(
          transformedProjects
        );

      return res.status(200).json({
        success: true,
        count: finalProjects.length,
        projects: finalProjects,
      });
    } catch (error) {
      console.error(
        "Error fetching all projects:",
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
// ❤️ LIKE
// ==========================================

router.post(
  "/:id/like",
  protect,
  likeProject
);

// ==========================================
// 💔 UNLIKE
// ==========================================

router.delete(
  "/:id/like",
  protect,
  unlikeProject
);

// ==========================================
// 💬 GET COMMENTS
// ==========================================

router.get(
  "/:id/comments",
  getComments
);

// ==========================================
// 💬 ADD COMMENT
// ==========================================

router.post(
  "/:id/comments",
  protect,
  addComment
);

// ==========================================
// 🗑️ DELETE COMMENT
// ==========================================

router.delete(
  "/comments/:commentId",
  protect,
  deleteComment
);

// ==========================================
// GET SINGLE
// ==========================================

router.get(
  "/:id",
  protect,
  getProject
);

// ==========================================
// UPDATE
// ==========================================

router.put(
  "/:id",
  protect,
  updateProject
);

// ==========================================
// DELETE
// ==========================================

router.delete(
  "/:id",
  protect,
  deleteProject
);

export default router;