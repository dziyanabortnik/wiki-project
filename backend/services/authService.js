const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ERRORS } = require('../constants/errorMessages');
const User = require('../models/user');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async register(userData) {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error(ERRORS.INVALID_EMAIL);
      }

      if (userData.password.length < 6) {
        throw new Error(ERRORS.PASSWORD_TOO_SHORT);
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error(ERRORS.USER_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.create({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name
      });

      const token = this.generateToken(user);

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      if (error.message.includes(ERRORS.USER_ALREADY_EXISTS) || 
          error.message.includes(ERRORS.INVALID_EMAIL) ||
          error.message.includes(ERRORS.PASSWORD_TOO_SHORT)) {
        throw error;
      }
      console.error('Registration error:', error);
      throw new Error('Failed to register user');
    }
  }

  async login(credentials) {
    try {
      const user = await User.findOne({
        where: { email: credentials.email.toLowerCase() }
      });

      if (!user) {
        throw new Error(ERRORS.INVALID_CREDENTIALS);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
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
        token
      };
    } catch (error) {
      if (error.message === ERRORS.INVALID_CREDENTIALS) {
        throw error;
      }
      console.error('Login error:', error);
      throw new Error('Failed to login');
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error(error.name === 'TokenExpiredError' ? ERRORS.TOKEN_EXPIRED : ERRORS.TOKEN_INVALID);
    }
  }

  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }
      return user;
    } catch (error) {
      if (error.message === ERRORS.USER_NOT_FOUND) {
        throw error;
      }
      console.error('Get profile error:', error);
      throw new Error('Failed to get user profile');
    }
  }
}

module.exports = AuthService;
