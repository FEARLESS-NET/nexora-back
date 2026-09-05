import mongoose from "mongoose";

import User from "../models/User.js";
import Project from "../models/projectModel.js";

// ==========================================
// UPLOAD IMAGE TO IMGBB
// ==========================================

const uploadToImgBB = async (buffer) => {
  try {
    if (!buffer) {
      return null;
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      console.error(
        "❌ IMGBB_API_KEY is missing in .env"
      );

      throw new Error(
        "ImgBB API key is not configured"
      );
    }

    const base64Image =
      buffer.toString("base64");

    const formData = new URLSearchParams();

    formData.append(
      "key",
      apiKey
    );

    formData.append(
      "image",
      base64Image
    );

    const response = await fetch(
      "https://api.imgbb.com/1/upload",
      {
        method: "POST",

        body: formData,
      }
    );

    const data =
      await response.json();

    console.log(
      "📸 ImgBB response:",
      data.success
    );

    if (
      !response.ok ||
      !data.success
    ) {
      console.error(
        "❌ ImgBB upload failed:",
        data
      );

      throw new Error(
        data?.error?.message ||
          "Image upload failed"
      );
    }

    return (
      data.data?.display_url ||
      data.data?.url ||
      null
    );
  } catch (error) {
    console.error(
      "❌ ImgBB upload error:",
      error
    );

    throw error;
  }
};

// ==========================================
// UPDATE PROFILE
// ==========================================

export const updateProfile = async (
  req,
  res
) => {
  try {
    console.log(
      "🔥 UPDATE PROFILE REQUEST"
    );

    console.log(
      "USER:",
      req.user
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILE:",
      req.file
        ? {
            originalname:
              req.file.originalname,
            mimetype:
              req.file.mimetype,
            size:
              req.file.size,
          }
        : "No avatar file"
    );

    const userId =
      req.user.userId;

    // ========================================
    // AUTH CHECK
    // ========================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ========================================
    // OBJECT ID CHECK
    // ========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    // ========================================
    // FIND USER
    // ========================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ========================================
    // GET BODY DATA
    // ========================================

    const {
      name,
      username,
      bio,
      location,
      skills,
      avatar,
      linkedinUrl,
      isAvailable,
    } = req.body;

    // ========================================
    // USERNAME UNIQUE CHECK
    // ========================================

    if (
      username !== undefined
    ) {
      const normalizedUsername =
        String(username)
          .toLowerCase()
          .trim();

      if (
        normalizedUsername &&
        normalizedUsername !==
          user.username
      ) {
        const existingUsername =
          await User.findOne({
            username:
              normalizedUsername,

            _id: {
              $ne: userId,
            },
          });

        if (existingUsername) {
          return res.status(409).json({
            success: false,
            message:
              "Username already exists",
          });
        }

        user.username =
          normalizedUsername;
      }
    }

    // ========================================
    // UPDATE BASIC INFO
    // ========================================

    if (
      name !== undefined &&
      String(name).trim()
    ) {
      user.name =
        String(name).trim();
    }

    if (
      bio !== undefined
    ) {
      user.bio =
        String(bio).trim();
    }

    if (
      location !== undefined
    ) {
      user.location =
        String(location).trim();
    }

    // ========================================
    // SKILLS
    // ========================================

    if (
      skills !== undefined
    ) {
      let parsedSkills =
        skills;

      // FormData orqali
      // JSON string kelishi mumkin

      if (
        typeof skills ===
        "string"
      ) {
        try {
          parsedSkills =
            JSON.parse(skills);
        } catch {
          parsedSkills =
            skills
              .split(",")
              .map(
                (skill) =>
                  skill.trim()
              )
              .filter(Boolean);
        }
      }

      if (
        Array.isArray(
          parsedSkills
        )
      ) {
        user.skills =
          parsedSkills
            .map((skill) =>
              String(
                skill
              ).trim()
            )
            .filter(Boolean);
      }
    }

    // ========================================
    // AVATAR
    // ========================================

    // Agar yangi rasm yuborilgan bo'lsa
    // avval ImgBB'ga upload qilamiz

    if (req.file) {
      console.log(
        "📸 Uploading avatar to ImgBB..."
      );

      const uploadedAvatar =
        await uploadToImgBB(
          req.file.buffer
        );

      if (!uploadedAvatar) {
        return res.status(500).json({
          success: false,
          message:
            "Avatar upload failed",
        });
      }

      user.avatar =
        uploadedAvatar;

      console.log(
        "✅ Avatar uploaded:",
        uploadedAvatar
      );
    }

    // ========================================
    // AVATAR URL
    // ========================================

    // Agar yangi fayl yuborilmagan bo'lsa,
    // eski URL tizimi ishlashda davom etadi.

    if (
      !req.file &&
      avatar !== undefined
    ) {
      user.avatar =
        String(avatar).trim();
    }

    // ========================================
    // LINKEDIN
    // ========================================

    if (
      linkedinUrl !== undefined
    ) {
      user.linkedinUrl =
        String(
          linkedinUrl
        ).trim();
    }

    // ========================================
    // AVAILABILITY
    // ========================================

    if (
      isAvailable !== undefined
    ) {
      if (
        typeof isAvailable ===
        "string"
      ) {
        user.isAvailable =
          isAvailable ===
          "true";
      } else {
        user.isAvailable =
          Boolean(
            isAvailable
          );
      }
    }

    // ========================================
    // SAVE
    // ========================================

    await user.save();

    console.log(
      "✅ PROFILE UPDATED:",
      user.username
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message:
        "Profile updated successfully",

      user: {
        id: user._id,

        name:
          user.name,

        username:
          user.username,

        email:
          user.email,

        role:
          user.role,

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
      "❌ Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error",
    });
  }
};

// ==========================================
// DELETE MY ACCOUNT
// ==========================================

export const deleteMyAccount = async (
  req,
  res
) => {
  try {
    console.log(
      "🗑️ DELETE ACCOUNT REQUEST"
    );

    console.log(
      "USER:",
      req.user
    );

    const userId =
      req.user.userId;

    // ========================================
    // AUTH CHECK
    // ========================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ========================================
    // OBJECT ID CHECK
    // ========================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    // ========================================
    // FIND USER
    // ========================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ========================================
    // DELETE ALL USER PROJECTS
    // ========================================

    const deletedProjects =
      await Project.deleteMany({
        owner: userId,
      });

    console.log(
      "🗑️ PROJECTS DELETED:",
      deletedProjects.deletedCount
    );

    // ========================================
    // DELETE USER
    // ========================================

    await User.findByIdAndDelete(
      userId
    );

    console.log(
      "✅ ACCOUNT DELETED:",
      user.email
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message:
        "Account and all associated projects deleted successfully",

      deletedProjects:
        deletedProjects.deletedCount,
    });
  } catch (error) {
    console.error(
      "❌ Delete account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error",
    });
  }
};