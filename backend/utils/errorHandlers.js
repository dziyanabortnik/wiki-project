const handleArticleNotFound = (article, id) => {
  if (!article) {
    throw new Error("Article not found");
  }
  return article;
};

const handleAttachmentNotFound = (attachment, attachmentId) => {
  if (!attachment) {
    throw new Error("Attachment not found");
  }
  return attachment;
};

const handleCommentNotFound = (comment, id) => {
  if (!comment) {
    throw new Error("Comment not found");
  }
  return comment;
};

const handleWorkspaceNotFound = (workspace, id) => {
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  return workspace;
};

module.exports = {
  handleArticleNotFound,
  handleAttachmentNotFound,
  handleCommentNotFound,
  handleWorkspaceNotFound
};
