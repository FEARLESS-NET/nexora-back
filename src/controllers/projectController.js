import mongoose from "mongoose";
import Project from "../models/projectModel.js";
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
        message:
          "Title and description are required",
      });
    }

    const project = await Project.create({
      title: title.trim(),

      description: description.trim(),

      tech: Array.isArray(tech)
        ? tech
        : [],

      status: status || "In Progress",

      githubUrl:
        githubUrl?.trim() || "",

      liveUrl:
        liveUrl?.trim() || "",

      owner: req.user.userId,
    });

    // ==========================================
    // GENERATE PREVIEW
    // ==========================================

    if (liveUrl?.trim()) {
      const previewImage =
        await generateProjectPreview(
          liveUrl.trim()
        );

      if (previewImage) {
        project.previewImage =
          previewImage;

        await project.save();
      }
    }

    return res.status(201).json({
      success: true,
      message:
        "Project created successfully",
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
        message:
          "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project ID",
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
        message:
          "Project not found",
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
        message:
          "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project ID",
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

    // ==========================================
    // FIND ONLY OWNER'S PROJECT
    // ==========================================

    const project =
      await Project.findOne({
        _id: id,
        owner: req.user.userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }

    // ==========================================
    // UPDATE BASIC DATA
    // ==========================================

    if (title !== undefined) {
      project.title =
        title.trim();
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

      // ========================================
      // LIVE URL O'ZGARGAN BO'LSA
      // YANGI SCREENSHOT
      // ========================================

      if (
        newLiveUrl &&
        newLiveUrl !== oldLiveUrl
      ) {
        const previewImage =
          await generateProjectPreview(
            newLiveUrl
          );

        if (previewImage) {
          project.previewImage =
            previewImage;
        }
      }

      // Live URL o'chirilsa
      if (!newLiveUrl) {
        project.previewImage = "";
      }
    }

    await project.save();

    return res.status(200).json({
      success: true,
      message:
        "Project updated successfully",
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
        message:
          "Project ID is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid project ID",
      });
    }

    // ==========================================
    // ONLY OWNER CAN DELETE
    // ==========================================

    const project =
      await Project.findOneAndDelete({
        _id: id,
        owner: req.user.userId,
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Project deleted successfully",
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