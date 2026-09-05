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
import Comment from "../models/Comment.js";

const router = express.Router();

// ======================================================
// CREATE PROJECT
// ======================================================

router.post(
  "/",
  protect,
  createProject
);

// ======================================================
// GET MY PROJECTS
// ======================================================

router.get(
  "/",
  protect,
  getMyProjects
);

// ======================================================
// GET ALL PROJECTS
// PUBLIC
// ======================================================

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
        await Promise.all(
          projects.map(
            async (project) => {
              try {
                const data =
                  project.toObject();

                const owner =
                  project.owner;

                let commentsCount = 0;

                try {
                  commentsCount =
                    await Comment.countDocuments(
                      {
                        project:
                          project._id,
                      }
                    );
                } catch (
                  commentError
                ) {
                  console.error(
                    "Comment count error:",
                    commentError
                  );

                  commentsCount = 0;
                }

                return {
                  ...data,

                  ownerId:
                    owner?._id ||
                    null,

                  ownerRole:
                    owner?.role ||
                    null,

                  // ==========================
                  // DEVELOPER
                  // ==========================

                  developerId:
                    owner?.role ===
                    "developer"
                      ? owner._id
                      : null,

                  developerName:
                    owner?.role ===
                    "developer"
                      ? owner.name
                      : null,

                  developerUsername:
                    owner?.role ===
                    "developer"
                      ? owner.username
                      : null,

                  developerAvatar:
                    owner?.role ===
                    "developer"
                      ? owner.avatar
                      : null,

                  // ==========================
                  // COMPANY
                  // ==========================

                  companyId:
                    owner?.role ===
                    "company"
                      ? owner._id
                      : null,

                  companyName:
                    owner?.role ===
                    "company"
                      ? owner.name
                      : null,

                  companyUsername:
                    owner?.role ===
                    "company"
                      ? owner.username
                      : null,

                  companyAvatar:
                    owner?.role ===
                    "company"
                      ? owner.avatar
                      : null,

                  // ==========================
                  // ❤️ LIKES
                  // ==========================

                  likes:
                    Array.isArray(
                      project.likedBy
                    )
                      ? project
                          .likedBy
                          .length
                      : 0,

                  // ==========================
                  // 💬 COMMENTS
                  // ==========================

                  comments:
                    commentsCount,
                };
              } catch (
                projectError
              ) {
                console.error(
                  "Project transform error:",
                  projectError
                );

                return null;
              }
            }
          )
        );

      const validProjects =
        transformedProjects.filter(
          Boolean
        );

      console.log(
        `✅ All projects loaded: ${validProjects.length}`
      );

      return res.status(200).json({
        success: true,

        count:
          validProjects.length,

        projects:
          validProjects,
      });
    } catch (error) {
      console.error(
        "❌ GET ALL PROJECTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Error fetching projects",
      });
    }
  }
);

// ======================================================
// ❤️ LIKE PROJECT
// POST /api/projects/:id/like
// ======================================================

router.post(
  "/:id/like",
  protect,
  likeProject
);

// ======================================================
// 💔 UNLIKE PROJECT
// DELETE /api/projects/:id/like
// ======================================================

router.delete(
  "/:id/like",
  protect,
  unlikeProject
);

// ======================================================
// 💬 GET COMMENTS
// PUBLIC
// ======================================================

router.get(
  "/:id/comments",
  getComments
);

// ======================================================
// 💬 ADD COMMENT
// LOGIN REQUIRED
// ======================================================

router.post(
  "/:id/comments",
  protect,
  addComment
);

// ======================================================
// 🗑️ DELETE COMMENT
// LOGIN REQUIRED
// ======================================================

router.delete(
  "/comments/:commentId",
  protect,
  deleteComment
);

// ======================================================
// GET SINGLE PROJECT
// ======================================================

router.get(
  "/:id",
  protect,
  getProject
);

// ======================================================
// UPDATE PROJECT
// ======================================================

router.put(
  "/:id",
  protect,
  updateProject
);

// ======================================================
// DELETE PROJECT
// ======================================================

router.delete(
  "/:id",
  protect,
  deleteProject
);

export default router;