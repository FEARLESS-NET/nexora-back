import mongoose from "mongoose";

import Company from "../models/Company.js";
import User from "../models/User.js";

// ==========================================
// CREATE COMPANY PROFILE
// ==========================================

export const createCompanyProfile = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      website,
      location,
      industry,
      size,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    // Check if user already has a company profile
    const existingCompany = await Company.findOne({
      owner: req.user.userId,
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "You already have a company profile",
      });
    }

    const company = await Company.create({
      name: name.trim(),
      description: description?.trim() || "",
      logo: logo || "",
      website: website?.trim() || "",
      location: location?.trim() || "",
      industry: industry?.trim() || "",
      size: size || "1-10",
      owner: req.user.userId,
    });

    // Update user role to company
    await User.findByIdAndUpdate(req.user.userId, {
      role: "company",
    });

    return res.status(201).json({
      success: true,
      message: "Company profile created successfully",
      company,
    });
  } catch (error) {
    console.error("Create company error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET MY COMPANY PROFILE
// ==========================================

export const getMyCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne({
      owner: req.user.userId,
    }).populate("owner", "name email");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Get company error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// UPDATE COMPANY PROFILE
// ==========================================

export const updateCompanyProfile = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      website,
      location,
      industry,
      size,
    } = req.body;

    const company = await Company.findOne({
      owner: req.user.userId,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    if (name !== undefined) {
      company.name = name.trim();
    }

    if (description !== undefined) {
      company.description = description.trim();
    }

    if (logo !== undefined) {
      company.logo = logo;
    }

    if (website !== undefined) {
      company.website = website.trim();
    }

    if (location !== undefined) {
      company.location = location.trim();
    }

    if (industry !== undefined) {
      company.industry = industry.trim();
    }

    if (size !== undefined) {
      company.size = size;
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      company,
    });
  } catch (error) {
    console.error("Update company error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL COMPANIES
// ==========================================

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// GET COMPANY BY ID
// ==========================================

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(id).populate(
      "owner",
      "name email"
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Get company by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};