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

module.exports = {
  handleArticleNotFound,
  handleAttachmentNotFound
};
