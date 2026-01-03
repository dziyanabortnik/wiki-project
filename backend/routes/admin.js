const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleMiddleware");
const UserService = require("../services/userService");
const { HTTP_STATUS, ERRORS } = require("../constants/errorMessages");

const userService = new UserService();

router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const users = await userService.getAllUsers(req.user.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        users,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users/stats",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const stats = await userService.getUsersStats();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/users/:userId/role",
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { role } = req.body;

      if (!role) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Role is required",
          error: ERRORS.ROLE_REQUIRED,
        });
      }

      const updatedUser = await userService.updateUserRole(
        req.params.userId,
        role,
        req.user.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
