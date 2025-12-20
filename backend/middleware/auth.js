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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (error) {
      // If token is invalid, just continue without user
    }
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth };
