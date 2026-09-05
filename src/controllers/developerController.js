import User from "../models/User.js";
import Project from "../models/projectModel.js";

// =====================================
// GET ALL DEVELOPERS
// =====================================

export const getDevelopers = async (req, res) => {
  try {
    const developers = await User.find({
      role: "developer",
    })
      .select(
        "name username avatar bio location skills isAvailable"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: developers.length,
      developers,
    });
  } catch (error) {
    console.error("Get developers error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =====================================
// GET DEVELOPER BY USERNAME
// =====================================

export const getDeveloperByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const developer = await User.findOne({
      username: username.toLowerCase().trim(),
      role: "developer",
    }).select(
  "name username avatar bio location skills isAvailable linkedinUrl"
   );

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    // Get developer's projects
    const projects = await Project.find({
      owner: developer._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      developer: {
        ...developer.toObject(),
        projects,
      },
    });
  } catch (error) {
    console.error(
      "Get developer by username error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};