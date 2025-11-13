const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const upload = require('./middleware/upload');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', (req, res, next) => {
  console.log('GET /uploads request:', req.url);
  next();
}, express.static(UPLOAD_DIR));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-article', (articleId) => {
    socket.join(articleId);
    console.log(`User ${socket.id} joined article ${articleId}`);
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// Helper function to send notifications to article room
const sendNotification = (articleId, message) => {
  console.log(`Sending notification to article ${articleId}: ${message}`);
  io.to(articleId).emit('notification', {
    message,
    timestamp: new Date().toISOString()
  });
};

// Get all articles
app.get('/articles', (req, res) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(DATA_DIR);
    const articles = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
          const articleData = JSON.parse(content);
          return { 
            id: path.basename(file, '.json'), 
            title: articleData.title,
            attachments: articleData.attachments || []
          };
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read articles' });
  }
});

// Get specific article by ID
app.get('/articles/:id', (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.id}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const article = JSON.parse(content);
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read article' });
  }
});

// Create new article
app.post('/articles', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const id = Date.now().toString();
  const article = {
    id,
    title,
    content,
    attachments: [],
    createdAt: new Date().toISOString()
  };

  const filePath = path.join(DATA_DIR, `${id}.json`);

  try {
    // Create data folder if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// Update existing article
app.put('/articles/:id', (req, res) => {
  const articleId = req.params.id;
  const { title, content } = req.body;
  const filePath = path.join(DATA_DIR, `${articleId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    // Read existing article to preserve createdAt
    const existingContent = fs.readFileSync(filePath, 'utf8');
    const existingArticle = JSON.parse(existingContent);
    
    const updatedArticle = {
      ...existingArticle,
      title,
      content,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));

    sendNotification(articleId, `Article "${title}" was updated`);
    io.to(articleId).emit('article-updated', updatedArticle);

    console.log(`Article updated: ${filePath}`);
    res.json(updatedArticle);
  } catch (err) {
    console.error('Failed to update article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete existing article
app.delete('/articles/:id', (req, res) => {
  const articleId = req.params.id;
  const filePath = path.join(DATA_DIR, `${articleId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  try {
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (article.attachments) {
        article.attachments.forEach(attachment => {
          const diskFile = path.join(UPLOAD_DIR, attachment.filename);
          if (fs.existsSync(diskFile)) {
            fs.unlinkSync(diskFile);
          }
        });
      }
    fs.unlinkSync(filePath);
    console.log(`Article deleted: ${filePath}`);
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Create attachment from article
app.post('/articles/:id/attachments', (req, res, next) => {
  const articleId = req.params.id;
  const filePath = path.join(DATA_DIR, `${articleId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // Multer middleware for file upload
  upload.array('files', 5)(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    const articleId = req.params.id;
    const filePath = path.join(DATA_DIR, `${articleId}.json`);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Create attachment metadata
    const newAttachments = req.files.map(file => ({
      id: Date.now() + '-' + Math.round(Math.random() * 1e9),
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/${file.filename.replace(/\\/g, '/')}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    article.attachments = [...(article.attachments || []), ...newAttachments];
    article.updatedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));

    // Notify all clients in article room
    io.to(articleId).emit('article-updated', article);
    sendNotification(articleId, newAttachments.length === 1
      ? `File attached: ${newAttachments[0].originalName}`
      : `${newAttachments.length} files attached`);

    res.json({ attachments: newAttachments });
  } catch (err) {
    console.error('Error adding attachments:', err);
    res.status(500).json({ error: 'Failed to add attachments: ' + err.message });
  }
});

// Remove attachment from article
app.delete('/articles/:id/attachments/:attachmentId', (req, res) => {
  const articleId = req.params.id;
  const attachmentId = req.params.attachmentId;
  const filePath = path.join(DATA_DIR, `${articleId}.json`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Article not found' });
  }

  try {
    const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const attachment = article.attachments.find(a => a.id == attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const diskFile = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(diskFile)) {
      fs.unlinkSync(diskFile);
      console.log(`Deleted file: ${diskFile}`);
    }

    // Remove attachment from article metadata
    article.attachments = article.attachments.filter(a => a.id != attachmentId);
    article.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));

    sendNotification(articleId, `Attachment removed: ${attachment.originalName}`);
    io.to(articleId).emit('article-updated', article);

    console.log(`Attachment removed: ${attachment.originalName}`);
    res.status(204).send();
  } catch (err) {
    console.error('Error removing attachment:', err);
    res.status(500).json({ error: 'Failed to remove attachment' });
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
