const { ERRORS, FILE_TYPES } = require('../constants/errorMessages');

const validateArticleData = (articleData) => {
  const { title, content } = articleData;
  
  if (!title || !title.trim()) {
    throw new Error(ERRORS.TITLE_REQUIRED);
  }
  
  if (!content || !content.trim()) {
    throw new Error(ERRORS.CONTENT_REQUIRED);
  }
  
  return true;
};

const validateAttachmentFiles = (files) => {
  if (!files || files.length === 0) {
    throw new Error(ERRORS.NO_FILES_UPLOADED);
  }

  const invalidFiles = files.filter(
    (file) => !FILE_TYPES.ALLOWED_MIME_TYPES.includes(file.mimetype)
  );
  
  if (invalidFiles.length > 0) {
    throw new Error(ERRORS.INVALID_FILE_TYPE);
  }
};

const validateCommentData = (commentData) => {
  const { content } = commentData;
  
  if (!content || !content.trim()) {
    throw new Error(ERRORS.COMMENT_CONTENT_REQUIRED);
  }
  
  return true;
};

const validateWorkspaceData = (workspaceData) => {
  const { name } = workspaceData;
  
  if (!name || !name.trim()) {
    throw new Error(ERRORS.WORKSPACE_NAME_REQUIRED);
  }
  
  return true;
};

const validateRegistrationData = (userData) => {
  const { email, password, name } = userData;
  
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(ERRORS.INVALID_EMAIL);
  }
  
  if (!password || password.length < 6) {
    throw new Error(ERRORS.PASSWORD_TOO_SHORT);
  }
  
  if (!name || !name.trim()) {
    throw new Error('Name is required');
  }
  
  return true;
};

const validateLoginData = (credentials) => {
  const { email, password } = credentials;
  
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password) {
    throw new Error('Password is required');
  }
  
  return true;
};

module.exports = {
  validateArticleData,
  validateAttachmentFiles,
  validateCommentData,
  validateWorkspaceData,
  validateRegistrationData,
  validateLoginData
};
