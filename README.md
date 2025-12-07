# Wiki Project

A full-stack application for creating and managing articles with a WYSIWYG editor.

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

## Built with

**Frontend:** React, React Router, React Quill, Vite  
**Backend:** Node.js, Express.js
**Database:** PostgreSQL with Sequelize ORM
**Real-time:** Socket.IO for live updates

## Architecture & Code Quality

- **Custom React Hooks**: `useArticleActions` for reusable delete logic across components
- **Error Handling**: Comprehensive validation on both frontend and backend
- **Real-Time Communication**: WebSocket integration for live updates
- **File Management**: Multer middleware for secure file uploads
- **Database Models**: Sequelize ORM with proper data validation and indexes
- **Service Layer**: Separated business logic (ArticleService, CommentService)
- **Migrations**: Database schema versioning and reproducibility

## Database Schema

- **articles**: Stores article content, titles, workspace associations, and attachments metadata
- **comments**: Stores user comments with article relationships and author information  
- **workspaces**: Predefined categories for organizing articles (Nature, Technology, Culture, etc.)

## Installation & Setup

### What you need
- Node.js (version 14 or higher)
- npm
- PostgreSQL database

### Database Setup
1. Create PostgreSQL database:
```bash
createdb wiki_dev
```

2. Set up environment variables in backend/.env.BackUp file:
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=wiki_dev
DB_HOST=localhost
DB_PORT=5432

3. Run database setup:
```bash
cd backend
npm run migrate
```

## Manual Setup

### Backend
```bash
cd backend
npm install
npm run migrate  
npm run dev
```

### Frontend
```bash
cd frontend  
npm install
npm run dev
```

## API Endpoints

### Articles
- GET /articles - List all articles
- GET /articles/:id - Get specific article
- POST /articles - Create new article
- PUT /articles/:id - Update existing article
- DELETE /articles/:id - Delete article

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
1. **View Articles**: Navigate to the home page to see all articles
2. **Filter by Workspace**: Use tabs to filter articles by category (All, Nature, Technology, Culture, Education, Uncategorized)
3. **Create Article**: Click "Create New Article" to open the editor
4. **Select Workspace**:: Choose appropriate category for your article
5. **Write Content**: Use the WYSIWYG editor to format content
6. **Add Attachments**: Upload images or PDF files (JPG, PNG, GIF, WebP, PDF only)
7. **Save**: Submit the form to save article
8. **Read**: Click any article title to view full content
9. **Add Comments**: Write comments on articles with optional author name
10. **Edit**: Click "Edit" while viewing an article to modify it
11. **Cancel Editing**: Click "Cancel" to discard changes and return to previous page
12. **Delete**: Click "Delete" to remove an article (with confirmation)
13. **Real-Time Updates**: Receive notifications when other users modify articles

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
