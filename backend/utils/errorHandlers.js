const { ERRORS } = require('../constants/errorMessages');

const handleArticleNotFound = (article, id) => {
  if (!article) {
    throw new Error(ERRORS.ARTICLE_NOT_FOUND);
  }
  return article;
};

const handleAttachmentNotFound = (attachment, attachmentId) => {
  if (!attachment) {
    throw new Error(ERRORS.ATTACHMENT_NOT_FOUND);
  }
  return attachment;
};

const handleCommentNotFound = (comment, id) => {
  if (!comment) {
    throw new Error(ERRORS.COMMENT_NOT_FOUND);
  }
  return comment;
};

const handleWorkspaceNotFound = (workspace, id) => {
  if (!workspace) {
    throw new Error(ERRORS.WORKSPACE_NOT_FOUND);
  }
  return workspace;
};

module.exports = {
  handleArticleNotFound,
  handleAttachmentNotFound,
  handleCommentNotFound,
  handleWorkspaceNotFound
};
