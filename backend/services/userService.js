const { ERRORS } = require("../constants/errorMessages");
const User = require("../models/user");

class UserService {
  constructor() {
    this.User = User;
  }

  // Get all users (for admin panel)
  async getAllUsers(currentUserId) {
    try {
      const users = await this.User.findAll({
        attributes: ["id", "email", "name", "role", "createdAt", "updatedAt"],
        order: [["createdAt", "DESC"]],
      });

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.User.findByPk(userId, {
        attributes: ["id", "email", "name", "role", "createdAt", "updatedAt"],
      });

      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error.message === ERRORS.USER_NOT_FOUND) {
        throw error;
      }
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async updateUserRole(userId, newRole, currentUserId) {
    try {
      const { VALID_ROLES } = ERRORS;

      if (!VALID_ROLES.includes(newRole)) {
        throw new Error(ERRORS.INVALID_ROLE);
      }

      const user = await this.User.findByPk(userId);
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      if (user.id === currentUserId) {
        throw new Error("You cannot change your own role");
      }

      await user.update({ role: newRole });

      // Return updated user without password
      const updatedUser = user.toJSON();
      delete updatedUser.password;

      return updatedUser;
    } catch (error) {
      if (
        error.message === ERRORS.USER_NOT_FOUND ||
        error.message === ERRORS.INVALID_ROLE ||
        error.message === "You cannot change your own role"
      ) {
        throw error;
      }
      console.error("Error updating user role:", error);
      throw new Error("Failed to update user role");
    }
  }

  async getUsersStats() {
    try {
      const totalUsers = await this.User.count();
      const adminCount = await this.User.count({ where: { role: "admin" } });
      const userCount = await this.User.count({ where: { role: "user" } });

      return {
        totalUsers,
        adminCount,
        userCount,
        adminPercentage:
          totalUsers > 0 ? ((adminCount / totalUsers) * 100).toFixed(1) : 0,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Failed to get user statistics");
    }
  }
}

module.exports = UserService;
