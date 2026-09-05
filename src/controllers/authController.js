import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==========================================
// REGISTER
// ==========================================

export const register = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      role,
    } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (
      !name ||
      !username ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, username, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // ========================================
    // ALLOWED REGISTER ROLES
    // ========================================
    // Admin orqali register qilib bo'lmaydi.

    const allowedRoles = [
      "developer",
      "client",
      "company",
    ];

    const selectedRole =
      role || "developer";

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Allowed roles: developer, client, company",
      });
    }

    // ========================================
    // NORMALIZE
    // ========================================

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedUsername =
      username.toLowerCase().trim();

    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser =
      await User.findOne({
        $or: [
          {
            email: normalizedEmail,
          },
          {
            username:
              normalizedUsername,
          },
        ],
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email or username already exists",
      });
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // ========================================
    // CREATE USER
    // ========================================

    const user =
      await User.create({
        name: name.trim(),

        username:
          normalizedUsername,

        email:
          normalizedEmail,

        password:
          hashedPassword,

        role: selectedRole,
      });

    // ========================================
    // CREATE JWT
    // ========================================

    const token =
      jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully",

      token,

      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,

        avatar:
          user.avatar || "",

        bio:
          user.bio || "",

        location:
          user.location || "",

        skills:
          user.skills || [],

        linkedinUrl:
          user.linkedinUrl || "",

        isAvailable:
          user.isAvailable,
      },
    });
  } catch (error) {
    console.error(
      "❌ Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res) => {
  try {
    console.log("================================");
    console.log("🔐 LOGIN REQUEST");
    console.log("EMAIL:", req.body?.email);
    console.log("JWT_SECRET EXISTS:", Boolean(process.env.JWT_SECRET));
    console.log("================================");

    const { email, password } = req.body || {};

    // ========================================
    // VALIDATION
    // ========================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // ========================================
    // FIND USER
    // ========================================

    const user =
      await User.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ========================================
    // CHECK PASSWORD
    // ========================================

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ========================================
    // CREATE JWT
    // ========================================

    const token =
      jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message:
        "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,

        avatar:
          user.avatar || "",

        bio:
          user.bio || "",

        location:
          user.location || "",

        skills:
          user.skills || [],

        linkedinUrl:
          user.linkedinUrl || "",

        isAvailable:
          user.isAvailable,
      },
    });
  } catch (error) {
    console.error(
      "❌ Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ME
// ==========================================

export const getMe = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.userId
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,

        avatar:
          user.avatar || "",

        bio:
          user.bio || "",

        location:
          user.location || "",

        skills:
          user.skills || [],

        linkedinUrl:
          user.linkedinUrl || "",

        isAvailable:
          user.isAvailable,
      },
    });
  } catch (error) {
    console.error(
      "❌ Get me error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword =
  async (req, res) => {
    try {
      console.log(
        "🔐 CHANGE PASSWORD REQUEST"
      );

      console.log(
        "USER:",
        req.user
      );

      const userId =
        req.user.userId;

      const {
        currentPassword,
        newPassword,
      } = req.body || {};

      // ========================================
      // VALIDATION
      // ========================================

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and new password are required",
        });
      }

      // ========================================
      // PASSWORD LENGTH
      // ========================================

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 6 characters",
        });
      }

      // ========================================
      // FIND USER
      // ========================================

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      // ========================================
      // CHECK CURRENT PASSWORD
      // ========================================

      const isCurrentPasswordCorrect =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (
        !isCurrentPasswordCorrect
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }

      // ========================================
      // CHECK SAME PASSWORD
      // ========================================

      const isSamePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }

      // ========================================
      // HASH NEW PASSWORD
      // ========================================

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.password =
        hashedPassword;

      // ========================================
      // SAVE
      // ========================================

      await user.save();

      console.log(
        "✅ PASSWORD CHANGED:",
        user.email
      );

      // ========================================
      // RESPONSE
      // ========================================

      return res.status(200).json({
        success: true,
        message:
          "Password changed successfully",
      });
    } catch (error) {
      console.error(
        "❌ Change password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };