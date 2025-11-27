const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { handleFileUpload } = require('./middleware/upload');
const SocketService = require('./services/socketService');
const ArticleService = require('./services/articleService');
const Comment = require('./models/comment');
const CommentService = require('./services/commentService');
const http = require('http');
require('dotenv').config();
const { sequelize } = require('./config/database');
const { Article } = require('./models');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// Middleware setup
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Initialize services
const socketService = new SocketService(server);
const articleService = new ArticleService(
  Article,
  path.join(__dirname, 'uploads')
);
const commentService = new CommentService(Comment, Article);

// Get all workspaces (hardcoded for now)
app.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await Workspace.findAll({
      order: [['name', 'ASC']]
    });
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get workspace by ID
app.get('/workspaces/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all articles
app.get('/articles', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    console.log('GET /articles with workspaceId:', workspaceId);
    
    const articles = await articleService.getAllArticles(workspaceId);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific article by ID
app.get('/articles/:id', async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.json(article);
  } catch (err) {
    if (err.message === 'Article not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Create new article
app.post('/articles', async (req, res) => {
  try {
    const article = await articleService.createArticle({
      ...req.body,  
      workspaceId: req.body.workspaceId || null});
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update existing article
app.put('/articles/:id', async (req, res) => {
  try {
    const updatedArticle = await articleService.updateArticle(req.params.id, req.body);

    // WebSocket notifications
    socketService.sendNotification(req.params.id, `Article "${req.body.title}" was updated`);
    socketService.emitToArticle(req.params.id, 'article-updated', updatedArticle);

    res.json(updatedArticle);
  } catch (err) {
    if (err.message === 'Article not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Delete existing article
app.delete('/articles/:id', async (req, res) => {
  try {
    await articleService.deleteArticle(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Article not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Create attachment from article
app.post('/articles/:id/attachments', handleFileUpload, async (req, res) => {
  try {
    const { article, attachments } = await articleService.addAttachments(req.params.id, req.files);
    
    // WebSocket notifications
    socketService.emitToArticle(req.params.id, 'article-updated', article);
    socketService.sendNotification(req.params.id, 
      attachments.length === 1 
        ? `File attached: ${attachments[0].originalName}`
        : `${attachments.length} files attached`
    );

    res.json({ attachments });
  } catch (err) {
    // Delete any files that might have been uploaded before error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, 'uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(400).json({ error: err.message });
  }
});

// Remove attachment from article
app.delete('/articles/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const attachment = await articleService.removeAttachment(req.params.id, req.params.attachmentId);

    // WebSocket notifications
    socketService.sendNotification(req.params.id, `Attachment removed: ${attachment.originalName}`);
    
    const article = await articleService.getArticleById(req.params.id);
    socketService.emitToArticle(req.params.id, 'article-updated', article);

    res.status(204).send();
  } catch (err) {
    if (err.message === 'Article not found' || err.message === 'Attachment not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get comments for article
app.get('/articles/:id/comments', async (req, res) => {
  try {
    const comments = await commentService.getCommentsByArticleId(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new comment
app.post('/articles/:id/comments', async (req, res) => {
  try {
    const comment = await commentService.createComment(req.params.id, req.body);
    res.status(201).json(comment);
  } catch (err) {
    if (err.message === "Article not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Update comment
app.put('/comments/:id', async (req, res) => {
  try {
    const comment = await commentService.updateComment(req.params.id, req.body);
    res.json(comment);
  } catch (err) {
    if (err.message === "Comment not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Delete comment
app.delete('/comments/:id', async (req, res) => {
  try {
    await commentService.deleteComment(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.message === "Comment not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get article with comments
app.get('/articles/:id/with-comments', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{
        model: Comment,
        attributes: ['id', 'content', 'author', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']]
      }]
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article with comments' });
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
  }
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error: ' + error.message });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
