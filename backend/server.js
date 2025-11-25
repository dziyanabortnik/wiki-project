const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { handleFileUpload } = require('./middleware/upload');
const SocketService = require('./services/socketService');
const ArticleService = require('./services/articleService');
const http = require('http');
require('dotenv').config();
const { sequelize } = require('./config/database');
const Article = require('./models/article');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Get all articles
app.get('/articles', async (req, res) => {
  try {
    const articles = await articleService.getAllArticles();
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
    const article = await articleService.createArticle(req.body);
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
