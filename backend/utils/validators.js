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

module.exports = {
  validateArticleData,
  validateAttachmentFiles,
  validateCommentData,
  validateWorkspaceData
};