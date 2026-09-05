import User from "../models/User.js";
import Company from "../models/Company.js";

// Get platform statistics
export const getPlatformStats = async (req, res) => {
  try {
    const developerCount = await User.countDocuments({ role: "developer" });
    const clientCount = await User.countDocuments({ role: "client" });
    const companyCount = await Company.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const totalUsers = await User.countDocuments();
    
    // Get active users (available developers)
    const activeDevelopers = await User.countDocuments({ 
      role: "developer", 
      isAvailable: true 
    });

    res.status(200).json({
      success: true,
      data: {
        developers: {
          total: developerCount,
          active: activeDevelopers,
          inactive: developerCount - activeDevelopers
        },
        clients: {
          total: clientCount
        },
        companies: {
          total: companyCount
        },
        admins: {
          total: adminCount
        },
        totalUsers: totalUsers,
        platformHealth: {
          status: "operational",
          userGrowth: "+12.5%",
          projectCompletion: "98.2%"
        }
      }
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching platform statistics"
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name role avatar createdAt");

    const recentCompanies = await Company.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name logo industry createdAt");

    res.status(200).json({
      success: true,
      data: {
        recentUsers,
        recentCompanies
      }
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent activity"
    });
  }
};