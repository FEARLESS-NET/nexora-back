import jwt from "jsonwebtoken";

// ==========================================
// PROTECT MIDDLEWARE
// ==========================================

export const protect = (req, res, next) => {
  try {
    // ========================================
    // GET AUTHORIZATION HEADER
    // ========================================

    const authHeader = req.headers.authorization;

    console.log("🔐 AUTH HEADER:", authHeader);

    // ========================================
    // CHECK HEADER
    // ========================================

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================
    // GET TOKEN
    // ========================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    console.log(
      "🔑 TOKEN LENGTH:",
      token.length
    );

    // ========================================
    // CHECK JWT SECRET
    // ========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ JWT_SECRET is missing in .env"
      );

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // ========================================
    // VERIFY TOKEN
    // ========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(
      "✅ DECODED USER:",
      decoded
    );

    // ========================================
    // CHECK USER ID
    // ========================================

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // ========================================
    // SAVE USER TO REQUEST
    // ========================================

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // ========================================
    // NEXT
    // ========================================

    next();

  } catch (error) {
    console.error(
      "❌ Auth middleware error:",
      error.message
    );

    // ========================================
    // TOKEN EXPIRED
    // ========================================

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    // ========================================
    // INVALID TOKEN
    // ========================================

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // ========================================
    // OTHER ERROR
    // ========================================

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// ==========================================
// OPTIONAL ROLE MIDDLEWARE
// ==========================================

export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      console.error(
        "❌ Authorization error:",
        error
      );

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
  };
};
