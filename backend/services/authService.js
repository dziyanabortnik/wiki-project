const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ERRORS } = require("../constants/errorMessages");
const User = require("../models/user");

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
  }

  async register(userData) {
    try {
      const { MIN_PASSWORD_LENGTH, DEFAULT_USER_ROLE, VALID_ROLES } = ERRORS;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error(ERRORS.INVALID_EMAIL);
      }

      if (userData.password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        );
      }

      const userRole = 'user';
      if (!VALID_ROLES.includes(userRole)) {
        throw new Error(ERRORS.INVALID_ROLE);
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error(ERRORS.USER_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.create({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        role: userRole,
      });

      const token = this.generateToken(user);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      console.error("Registration error details:", error);
      if (
        error.message === ERRORS.INVALID_EMAIL ||
        error.message === ERRORS.USER_ALREADY_EXISTS ||
        error.message.includes("Password must be at least") ||
        error.message === ERRORS.INVALID_ROLE
      ) {
        throw error;
      }
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  }

  async login(credentials) {
    try {
      if (!credentials.email || !credentials.password) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      const user = await User.scope("withPassword").findOne({
        where: { email: credentials.email.toLowerCase() },
      });

      if (!user) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      // Check password
      if (!user.password) {
        console.error("User has no password stored:", user.email);
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      console.error("Login error details:", error);
      if (error.message === ERRORS.INVALID_CREDENTIALS) {
        throw error;
      }
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  }

  generateToken(user) {
    if (!this.jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || ERRORS.DEFAULT_USER_ROLE,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(
        error.name === "TokenExpiredError"
          ? ERRORS.TOKEN_EXPIRED
          : ERRORS.TOKEN_INVALID
      );
    }
  }

  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error.message === ERRORS.USER_NOT_FOUND) {
        throw error;
      }
      console.error("Get profile error:", error);
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = AuthService;
