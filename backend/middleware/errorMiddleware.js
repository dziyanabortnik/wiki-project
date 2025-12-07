const { ERRORS, HTTP_STATUS } = require('../constants/errorMessages');

const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERRORS.INTERNAL_SERVER_ERROR;

  const notFoundErrors = [
    ERRORS.ARTICLE_NOT_FOUND,
    ERRORS.ATTACHMENT_NOT_FOUND,
    ERRORS.COMMENT_NOT_FOUND,
    ERRORS.WORKSPACE_NOT_FOUND
  ];
  
  if (notFoundErrors.includes(err.message)) {
    statusCode = HTTP_STATUS.NOT_FOUND;
    message = err.message;
  }
  
  const validationErrors = [
    ERRORS.TITLE_REQUIRED,
    ERRORS.CONTENT_REQUIRED,
    ERRORS.COMMENT_CONTENT_REQUIRED,
    ERRORS.WORKSPACE_NAME_REQUIRED,
    ERRORS.INVALID_FILE_TYPE,
    ERRORS.FILE_TOO_LARGE,
    ERRORS.NO_FILES_UPLOADED
  ];
  
  if (validationErrors.includes(err.message)) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = ERRORS.FILE_TOO_LARGE;
  }
  
  if (err.message.includes('Invalid file type')) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = ERRORS.INVALID_FILE_TYPE;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
