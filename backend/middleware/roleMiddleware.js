const { ERRORS, HTTP_STATUS } = require("../constants/errorMessages");

// Middleware factory for role-based access control
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERRORS.UNAUTHORIZED,
        error: "Authentication required",
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERRORS.ADMIN_ONLY,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

// Admin-only middleware
const requireAdmin = requireRole("admin");

// Check if user is article owner or admin
const requireArticleOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERRORS.UNAUTHORIZED,
        error: "Authentication required",
      });
    }

    // Admins have full access
    if (req.user.role === "admin") {
      return next();
    }

    const { id } = req.params;
    const Article = require("../models/article");

    const article = await Article.findByPk(id, {
      attributes: ["id", "userId"],
    });

    if (!article) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERRORS.ARTICLE_NOT_FOUND,
        error: "Article not found",
      });
    }

     // Check if user is the article owner
    if (article.userId !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERRORS.NOT_ARTICLE_OWNER,
        error: "You can only edit your own articles",
      });
    }

    next();
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERRORS.INTERNAL_SERVER_ERROR,
      error: "Permission check failed",
    });
  }
};

module.exports = {
  requireRole,
  requireAdmin,
  requireArticleOwnerOrAdmin,
};
