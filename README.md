# Wiki Project

A full-stack application for creating and managing articles with a WYSIWYG editor.

## Features

- Write articles with formatting tools
- See all your articles in a list  
- Read full articles
- Edit existing articles
- Cancel editing
- Delete articles
- Articles save automatically as files

## Built with

**Frontend:** React, React Router, React Quill, Vite  
**Backend:** Node.js, Express.js

## Installation & Setup

### What you need
- Node.js (version 14 or higher)
- npm

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

## Usage
1. **View Articles**: Navigate to the home page to see all articles
2. **Create Article**: Click "Create New Article" to open the editor
3. **Write Content**: Use the WYSIWYG editor to format content
4. **Save**: Submit the form to save article
5. **Read**: Click any article title to view full content
6. **Edit**: Click "Edit" while viewing an article to modify it
7. **Cancel Editing**: Click "Cancel" to discard changes and return to previous page
8. **Delete**: Click "Delete" to remove an article (with confirmation)
