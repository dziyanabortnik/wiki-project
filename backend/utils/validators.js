const validateArticleData = (articleData) => {
  const { title, content } = articleData;
  
  if (!title || !title.trim()) {
    throw new Error("Title is required");
  }
  
  if (!content || !content.trim()) {
    throw new Error("Content is required");
  }
  
  return true;
};

const validateAttachmentFiles = (files) => {
  if (!files || files.length === 0) {
    throw new Error("No files uploaded");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  const invalidFiles = files.filter(
    (file) => !allowedTypes.includes(file.mimetype)
  );
  
  if (invalidFiles.length > 0) {
    throw new Error(
      `Invalid file types: ${invalidFiles
        .map((f) => f.originalname)
        .join(", ")}. Only images and PDFs are allowed.`
    );
  }
};

const validateCommentData = (commentData) => {
  const { content } = commentData;
  
  if (!content || !content.trim()) {
    throw new Error("Comment content is required");
  }
  
  return true;
};

const validateWorkspaceData = (workspaceData) => {
  const { name } = workspaceData;
  
  if (!name || !name.trim()) {
    throw new Error("Workspace name is required");
  }
  
  return true;
};

module.exports = {
  validateArticleData,
  validateAttachmentFiles,
  validateCommentData,
  validateWorkspaceData
};
