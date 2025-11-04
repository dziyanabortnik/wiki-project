const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

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
          const { title } = JSON.parse(content);
          return { id: path.basename(file, '.json'), title };
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
    fs.unlinkSync(filePath);
    console.log(`Article deleted: ${filePath}`);
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
