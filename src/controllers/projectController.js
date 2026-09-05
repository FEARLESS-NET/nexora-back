import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import Comment from "../models/Comment.js";

import {
  generateProjectPreview,
} from "../services/projectPreviewService.js";

// ==========================================
// CREATE PROJECT
// ==========================================

export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      tech,
      status,
      githubUrl,
      liveUrl,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const project = await Project.create({
      title: title.trim(),

      description: description.trim(),

      tech: Array.isArray(tech)
        ? tech
        : [],

      status: status || "In Progress",

      githubUrl: githubUrl?.trim() || "",

      liveUrl: liveUrl?.trim() || "",

      owner: req.user.userId,

      likedBy: [],
    });

    // ==========================================
    // GENERATE PREVIEW
    // ==========================================

    if (liveUrl?.trim()) {
      try {
        const previewImage =
          await generateProjectPreview(
            liveUrl.trim()
          );

        if (previewImage) {
          project.previewImage =
            previewImage;

          await project.save();
        }
      } catch (previewError) {
        console.error(
          "Project preview error:",
          previewError
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY PROJECTS
// ==========================================

export const getMyProjects = async (
  req,
  res
) => {
  try {
    const projects =
      await Project.find({
        owner: req.user.userId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error(
      "Get projects error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET SINGLE PROJECT
// ==========================================

export const getProject = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project =
      await Project.findOne({
        _id: id,
        owner: req.user.userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE PROJECT
// ==========================================

export const updateProject = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const {
      title,
      description,
      tech,
      status,
      githubUrl,
      liveUrl,
    } = req.body;

    const project =
      await Project.findOne({
        _id: id,
        owner: req.user.userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (title !== undefined) {
      project.title = title.trim();
    }

    if (description !== undefined) {
      project.description =
        description.trim();
    }

    if (tech !== undefined) {
      project.tech =
        Array.isArray(tech)
          ? tech
          : [];
    }

    if (status !== undefined) {
      project.status = status;
    }

    if (githubUrl !== undefined) {
      project.githubUrl =
        githubUrl.trim();
    }

    // ==========================================
    // LIVE URL
    // ==========================================

    if (liveUrl !== undefined) {
      const oldLiveUrl =
        project.liveUrl;

      const newLiveUrl =
        liveUrl.trim();

      project.liveUrl =
        newLiveUrl;

      if (
        newLiveUrl &&
        newLiveUrl !== oldLiveUrl
      ) {
        try {
          const previewImage =
            await generateProjectPreview(
              newLiveUrl
            );

          if (previewImage) {
            project.previewImage =
              previewImage;
          }
        } catch (previewError) {
          console.error(
            "Preview generation error:",
            previewError
          );
        }
      }

      if (!newLiveUrl) {
        project.previewImage = "";
      }
    }

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE PROJECT
// ==========================================

export const deleteProject = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project =
      await Project.findOneAndDelete({
        _id: id,
        owner: req.user.userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Project o'chirilsa unga tegishli
    // commentlar ham o'chadi
    await Comment.deleteMany({
      project: id,
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// ❤️ LIKE PROJECT
// POST /api/projects/:id/like
// ======================================================

export const likeProject = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project =
      await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const alreadyLiked =
      project.likedBy.some(
        (user) =>
          user.toString() ===
          userId.toString()
      );

    if (alreadyLiked) {
      return res.status(200).json({
        success: true,
        message: "Already liked",
        liked: true,
        likesCount:
          project.likedBy.length,
      });
    }

    project.likedBy.push(userId);

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project liked",
      liked: true,
      likesCount:
        project.likedBy.length,
    });
  } catch (error) {
    console.error(
      "Like project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// 💔 UNLIKE PROJECT
// DELETE /api/projects/:id/like
// ======================================================

export const unlikeProject = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project =
      await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.likedBy =
      project.likedBy.filter(
        (user) =>
          user.toString() !==
          userId.toString()
      );

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project unliked",
      liked: false,
      likesCount:
        project.likedBy.length,
    });
  } catch (error) {
    console.error(
      "Unlike project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// 💬 ADD COMMENT
// POST /api/projects/:id/comments
// ======================================================

export const addComment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (
      !content ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    const project =
      await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const comment =
      await Comment.create({
        content: content.trim(),
        project: id,
        author: req.user.userId,
      });

    const populatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "author",
        "name username avatar"
      );

    return res.status(201).json({
      success: true,
      message: "Comment added",
      comment: populatedComment,
      commentsCount:
        await Comment.countDocuments({
          project: id,
        }),
    });
  } catch (error) {
    console.error(
      "Add comment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// 💬 GET COMMENTS
// GET /api/projects/:id/comments
// ======================================================

export const getComments = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project =
      await Project.exists({
        _id: id,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const comments =
      await Comment.find({
        project: id,
      })
        .populate(
          "author",
          "name username avatar"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error(
      "Get comments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// 🗑️ DELETE COMMENT
// DELETE /api/projects/comments/:commentId
// ======================================================

export const deleteComment = async (
  req,
  res
) => {
  try {
    const { commentId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        commentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const comment =
      await Comment.findById(
        commentId
      );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (
      comment.author.toString() !==
      req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own comment",
      });
    }

    await Comment.findByIdAndDelete(
      commentId
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    console.error(
      "Delete comment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};