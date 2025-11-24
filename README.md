# Wiki Project

A full-stack application for creating and managing articles with a WYSIWYG editor.

## Features

- Write articles with formatting tools
- See all your articles in a list  
- Read full articles
- Edit existing articles
- Cancel editing
- Delete articles
- Database Storage
- Articles save automatically as files
- File Attachments: Upload images and PDFs to articles
- Real-Time Notifications: Live updates when articles are modified

## Built with

**Frontend:** React, React Router, React Quill, Vite  
**Backend:** Node.js, Express.js
**Database:** PostgreSQL with Sequelize ORM

## Architecture & Code Quality

- **Custom React Hooks**: `useArticleActions` for reusable delete logic across components
- **Error Handling**: Comprehensive validation on both frontend and backend
- **Real-Time Communication**: WebSocket integration for live updates
- **File Management**: Multer middleware for secure file uploads
- **Database Models**: Sequelize ORM with proper data validation and indexes

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

2. Set up environment variables in .env file:
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=wiki_dev
DB_HOST=localhost
DB_PORT=5432

3. Run database setup:
```bash
node backend/scripts/migrate.js
```

### Quick Start
```bash
npm install
npm run start
```

## Manual Setup

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend  
npm install
npm run dev
```

## API Endpoints
- GET /articles - List all articles
- GET /articles/:id - Get specific article
- POST /articles - Create new article
- PUT /articles/:id - Update existing article
- DELETE /articles/:id - Delete article
- POST /articles/:id/attachments - Upload files to article
- DELETE /articles/:id/attachments/:attachmentId - Remove attachment

## WebSocket Events
- join-article - Join article room for real-time updates
- article-updated - Notify when article is modified
- notification - Send real-time notifications to users

## Usage
1. **View Articles**: Navigate to the home page to see all articles
2. **Create Article**: Click "Create New Article" to open the editor
3. **Write Content**: Use the WYSIWYG editor to format content
4. **Add Attachments**: Upload images or PDF files (JPG, PNG, GIF, WebP, PDF only)
5. **Save**: Submit the form to save article
6. **Read**: Click any article title to view full content
7. **Edit**: Click "Edit" while viewing an article to modify it
8. **Cancel Editing**: Click "Cancel" to discard changes and return to previous page
9. **Delete**: Click "Delete" to remove an article (with confirmation)
10. **Real-Time Updates**: Receive notifications when other users modify articles

## File Attachments
- Supported formats: JPG, JPEG, PNG, GIF, WebP, PDF
- Files are stored securely in uploads directory
- Click attachments to view in new window/tab
- Automatic cleanup when articles are deleted

## Validation & Error Handling
- **Article Existence Validation**: Cannot edit or delete non-existent articles
- **Required Fields**: Title and content validation on both frontend and backend
- **File Type Validation**: Only allowed file formats can be uploaded
- **User Feedback**: Clear error messages and loading states
- **Real-Time Notifications**: Live alerts for article changes and file operations
- **Database Constraints**: Data integrity enforced at database level
