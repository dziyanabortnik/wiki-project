module.exports = {
  ERRORS: {
    // Articles
    ARTICLE_NOT_FOUND: 'Article not found',
    ARTICLE_CREATE_FAILED: 'Failed to create article',
    ARTICLE_UPDATE_FAILED: 'Failed to update article',
    ARTICLE_DELETE_FAILED: 'Failed to delete article',
    ARTICLE_FETCH_FAILED: 'Failed to fetch article',
    TITLE_REQUIRED: 'Title is required',
    CONTENT_REQUIRED: 'Content is required',
    
    // Attachments
    ATTACHMENT_NOT_FOUND: 'Attachment not found',
    ATTACHMENT_UPLOAD_FAILED: 'Failed to upload attachment',
    ATTACHMENT_REMOVE_FAILED: 'Failed to remove attachment',
    INVALID_FILE_TYPE: 'Invalid file type. Only images and PDFs are allowed.',
    FILE_TOO_LARGE: 'File size too large. Maximum 10MB allowed.',
    NO_FILES_UPLOADED: 'No files uploaded',
    
    // Comments
    COMMENT_NOT_FOUND: 'Comment not found',
    COMMENT_CREATE_FAILED: 'Failed to create comment',
    COMMENT_UPDATE_FAILED: 'Failed to update comment',
    COMMENT_DELETE_FAILED: 'Failed to delete comment',
    COMMENT_FETCH_FAILED: 'Failed to fetch comments',
    COMMENT_CONTENT_REQUIRED: 'Comment content is required',
    
    // Workspaces
    WORKSPACE_NOT_FOUND: 'Workspace not found',
    WORKSPACE_FETCH_FAILED: 'Failed to fetch workspaces',
    WORKSPACE_NAME_REQUIRED: 'Workspace name is required',
    
    // Database
    DB_CONNECTION_FAILED: 'Database connection failed',
    DB_QUERY_FAILED: 'Database query failed',
    
    // Validation
    VALIDATION_ERROR: 'Validation error',
    
    // Server
    INTERNAL_SERVER_ERROR: 'Internal server error'
  },
  
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  
  FILE_TYPES: {
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ],
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
  }
};
