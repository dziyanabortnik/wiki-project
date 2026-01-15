# Wiki Project

A full-stack application for creating and managing articles with a WYSIWYG editor and full user management system.

## Features

- Write articles with formatting tools
- See all your articles in a list
- Read full articles
- Edit existing articles
- Cancel editing
- Delete articles
- Workspace Organization: Organize articles into different workspaces/categories
- Comments System: Add and manage comments on articles
- Database Storage: All data persisted in PostgreSQL database
- File Attachments: Upload images and PDFs to articles
- Real-Time Notifications: Live updates when articles are modified
- User Authentication: Secure registration and login with JWT tokens
- Protected Content: Access control for articles and comments
- Article Versioning: Track all changes to articles with full version history
- Role-Based Access Control: Admin and user roles with different permissions
- User Management Dashboard: Admins can view and manage user roles
- Article Ownership Protection: Only article creators or admins can edit articles
- Article Search: Full-text search across article titles and content with highlighting

## Built with

**Frontend:** React, React Router, React Quill, Vite  
**Backend:** Node.js, Express.js
**Database:** PostgreSQL with Sequelize ORM
**Real-time:** Socket.IO for live updates
**Authentication:** JWT, bcrypt, React Context
**Security:** Protected Routes, Token Validation, Password Hashing

## Architecture & Code Quality

- **Custom React Hooks**: `useArticleActions` for reusable delete logic across components
- **Error Handling**: Comprehensive validation on both frontend and backend
- **Real-Time Communication**: WebSocket integration for live updates
- **File Management**: Multer middleware for secure file uploads
- **Database Models**: Sequelize ORM with proper data validation and indexes
- **Service Layer**: Separated business logic (ArticleService, CommentService)
- **Migrations**: Database schema versioning and reproducibility
- **Version Control System**: Complete article versioning with rollback capability
- **Authentication Layer**: JWT-based auth with protected routes and endpoints
- **Search Functionality**: Integrated search with database indexing and real-time result highlighting

## Database Schema

- **articles**: Stores article content, titles, workspace associations, and attachments metadata
- **article_versions**: Complete version history for articles with change tracking
- **comments**: Stores user comments with article relationships and author information
- **workspaces**: Predefined categories for organizing articles (Nature, Technology, Culture, etc.)
- **users**: User accounts for authentication, attribution, and role management (admin/user)

## Installation & Setup

### What you need

- Node.js (version 14 or higher)
- npm
- PostgreSQL database

### First-Time Setup (Only Once)

1. Create PostgreSQL database:

```bash
createdb wiki_dev
```

2. Set up environment variables in backend/.env file:
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=wiki_dev
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=your-jwt-secret-key  # Required for authentication to work
   JWT_EXPIRES_IN=24h

3. Backend setup:

```bash
cd backend
npm install # Install dependencies (only first time or when dependencies change)
npm run setup # Run initial setup (creates tables AND admin user)
npm run dev
```

4. Frontend setup:

```bash
cd frontend
npm install # Install dependencies (only first time or when dependencies change)
npm run dev
```

## Regular Development Workflow

### Backend

```bash
cd backend
npm install # Only if dependencies change
npm run dev
```

### Frontend

```bash
cd frontend
npm install # Only if dependencies change
npm run dev
```

## API Endpoints

### Admin Management (Admin only)

- GET /api/admin/users - List all users with roles
- GET /api/admin/users/stats - Get user statistics
- PUT /api/admin/users/:userId/role - Update user role

### Authentication

- POST /api/auth/register - Register new user
- POST /api/auth/login - User login with JWT response
- GET /api/auth/profile - Get authenticated user profile

### Articles

- GET /articles - List all articles
- GET /articles/:id - Get specific article
- POST /articles - Create new article
- PUT /articles/:id - Update existing article
- DELETE /articles/:id - Delete article
- GET /api/articles/search?q=term - Search articles by title or content

### Version History

- GET /api/articles/:id/versions - Get all versions of an article (shows who changed)
- GET /api/articles/:id/versions/:versionNumber - Get specific version
- POST /api/articles/:id/versions/:versionNumber/restore - Restore to previous version

### Attachments

- POST /articles/:id/attachments - Upload files to article
- DELETE /articles/:id/attachments/:attachmentId - Remove attachment

### Comments

- GET /articles/:id/comments - Get comments for article
- POST /articles/:id/comments - Add new comment
- PUT /comments/:id - Update comment
- DELETE /comments/:id - Delete comment

### Workspaces

- GET /workspaces - List all available workspaces
- GET /workspaces/:id - Get specific workspace details

## WebSocket Events

- join-article - Join article room for real-time updates
- article-updated - Notify when article is modified
- notification - Send real-time notifications to users

## Usage

1. **Register**: Create account with email and password
2. **Login**: Authenticate to receive JWT token
3. **Access Control**: Only authenticated users can create/edit content
4. **View Articles**: Navigate to the home page to see all articles
5. **Filter by Workspace**: Use tabs to filter articles by category (All, Nature, Technology, Culture, Education, Uncategorized)
6. **Create Article**: Click "Create New Article" to open the editor
7. **Select Workspace**:: Choose appropriate category for your article
8. **Write Content**: Use the WYSIWYG editor to format content
9. **Add Attachments**: Upload images or PDF files (JPG, PNG, GIF, WebP, PDF only)
10. **Save**: Submit the form to save article
11. **Read**: Click any article title to view full content
12. **Edit**: Click "Edit" while viewing an article to modify it
13. **Cancel Editing**: Click "Cancel" to discard changes and return to previous page
14. **Delete**: Click "Delete" to remove an article (with confirmation)
15. **Version History**: View all changes and who made them
16. **Track Changes**: Every edit creates a new version with timestamp and author
17. **View History**: See complete version timeline with change details
18. **Real-Time Updates**: Receive notifications when other users modify articles
19. **Admin Access**: Admins see "User Management" in navigation
20. **Role Management**: Admins can view all users and change their roles
21. **Article Permissions**: Users can only edit their own articles, admins can edit all
22. **Admin Protection**: User management page accessible only to administrators

## File Attachments

- Supported formats: JPG, JPEG, PNG, GIF, WebP, PDF
- Files are stored securely in uploads directory
- Click attachments to view in new window/tab
- Automatic cleanup when articles are deleted

## Workspace Categories

- Nature & Science: Articles about environment, animals, science
- Technology: Programming, IT, innovations
- Culture & Arts: Traditions, art, history, humanities
- Education: Learning materials, tutorials
- Uncategorized: Articles without specific category

## Validation & Error Handling

- **Article Existence Validation**: Cannot edit or delete non-existent articles
- **Required Fields**: Title and content validation on both frontend and backend
- **File Type Validation**: Only allowed file formats can be uploaded
- **Comment Validation**: Content required for comments
- **Workspace Validation**: Articles must belong to valid workspace
- **User Feedback**: Clear error messages and loading states
- **Real-Time Notifications**: Live alerts for article changes and file operations
- **Database Constraints**: Data integrity enforced at database level
- **Email Format Validation**: Proper email format required for registration/login
- **Password Strength**: Minimum 6 characters for passwords
- **Unique Email**: Email must be unique during registration
- **Credential Validation**: Email/password verified during login
- **Token Validation**: JWT tokens checked for validity and expiration
- **Ownership Validation**: Users can only modify their own content
- **Role Validation**: User roles validated on all protected operations
- **Admin Authorization**: Admin-only endpoints protected with role checks
- **Permission Validation**: Article edits require ownership or admin role
- **Environment Validation**: Application requires JWT_SECRET and fails to start without it
