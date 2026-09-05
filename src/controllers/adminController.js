import User from "../models/User.js";
import Project from "../models/projectModel.js";
import Company from "../models/Company.js";
import Proposal from "../models/Proposal.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";

// ==========================================
// GET DASHBOARD STATISTICS
// ==========================================

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDevelopers = await User.countDocuments({ role: "developer" });
    const totalCompanies = await User.countDocuments({ role: "company" });
    const totalProjects = await Project.countDocuments();
    const totalProposals = await Proposal.countDocuments();
    const totalMessages = await Message.countDocuments();

    const recentUsers = await User.find()
      .select("name username role createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentProjects = await Project.find()
      .select("title status createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDevelopers,
        totalCompanies,
        totalProjects,
        totalProposals,
        totalMessages,
      },
      recentUsers,
      recentProjects,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("name username email role isAvailable createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE USER
// ==========================================

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user's projects
    await Project.deleteMany({ owner: userId });

    // Delete user's proposals
    await Proposal.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Delete user's notifications
    await Notification.deleteMany({ recipient: userId });

    // Delete user's company profile if exists
    await Company.deleteOne({ owner: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL PROJECTS
// ==========================================

export const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const projects = await Project.find()
      .populate("owner", "name username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Project.countDocuments();

    return res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      projects,
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// DELETE PROJECT
// ==========================================

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await Project.findByIdAndDelete(projectId);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL PROPOSALS
// ==========================================

export const getAllProposals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const proposals = await Proposal.find(query)
      .populate("sender", "name username")
      .populate("receiver", "name username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Proposal.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: proposals.length,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      proposals,
    });
  } catch (error) {
    console.error("Get all proposals error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};