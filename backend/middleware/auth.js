const jwt = require('jsonwebtoken');
const { ERRORS, HTTP_STATUS } = require('../constants/errorMessages');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERRORS.TOKEN_REQUIRED,
      error: 'Access token is required'
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERRORS.TOKEN_EXPIRED,
        error: 'Token has expired'
      });
    }
    
    if (error.message === 'JWT_SECRET is not configured') {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Authentication service unavailable',
        error: 'Server configuration error - JWT_SECRET not set'
      });
    }
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERRORS.TOKEN_INVALID,
      error: 'Invalid token'
    });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
    }
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth };
