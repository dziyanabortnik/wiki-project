const fs = require("fs");
const path = require("path");

class ArticleService {
  constructor(dataDir, uploadDir) {
    this.DATA_DIR = dataDir;
    this.UPLOAD_DIR = uploadDir;
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  getAllArticles() {
    try {
      if (!fs.existsSync(this.DATA_DIR)) {
        return [];
      }

      const files = fs.readdirSync(this.DATA_DIR);
      const articles = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          try {
            const content = fs.readFileSync(
              path.join(this.DATA_DIR, file),
              "utf8"
            );
            const articleData = JSON.parse(content);
            return {
              id: path.basename(file, ".json"),
              title: articleData.title,
              attachments: articleData.attachments || [],
            };
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean);

      return articles;
    } catch (err) {
      throw new Error("Failed to read articles");
    }
  }

  getArticleById(id) {
    const filePath = path.join(this.DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Article not found");
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    } catch (err) {
      throw new Error("Failed to read article");
    }
  }

  createArticle(articleData) {
    const { title, content } = articleData;

    if (!title || !content) {
      throw new Error("Title and content are required");
    }

    const id = Date.now().toString();
    const article = {
      id,
      title,
      content,
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    const filePath = path.join(this.DATA_DIR, `${id}.json`);

    try {
      fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
      return article;
    } catch (err) {
      throw new Error("Failed to save article");
    }
  }

  updateArticle(id, updateData) {
    const { title, content } = updateData;
    const filePath = path.join(this.DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Article not found");
    }

    if (!title || !content) {
      throw new Error("Title and content are required");
    }

    try {
      const existingContent = fs.readFileSync(filePath, "utf8");
      const existingArticle = JSON.parse(existingContent);

      const updatedArticle = {
        ...existingArticle,
        title,
        content,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));
      return updatedArticle;
    } catch (err) {
      throw new Error("Failed to update article");
    }
  }

  deleteArticle(id) {
    const filePath = path.join(this.DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Article not found");
    }

    try {
      const article = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Delete attachment files
      if (article.attachments) {
        article.attachments.forEach((attachment) => {
          const diskFile = path.join(this.UPLOAD_DIR, attachment.filename);
          if (fs.existsSync(diskFile)) {
            fs.unlinkSync(diskFile);
          }
        });
      }

      fs.unlinkSync(filePath);
    } catch (err) {
      throw new Error("Failed to delete article");
    }
  }

  addAttachments(articleId, files) {
    const filePath = path.join(this.DATA_DIR, `${articleId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Article not found");
    }

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

    try {
      const article = JSON.parse(fs.readFileSync(filePath, "utf8"));

      const newAttachments = files.map((file) => ({
        id: Date.now() + "-" + Math.round(Math.random() * 1e9),
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));

      article.attachments = [...(article.attachments || []), ...newAttachments];
      article.updatedAt = new Date().toISOString();

      fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
      return { article, attachments: newAttachments };
    } catch (err) {
      throw new Error("Failed to add attachments: " + err.message);
    }
  }

  removeAttachment(articleId, attachmentId) {
    const filePath = path.join(this.DATA_DIR, `${articleId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error("Article not found");
    }

    try {
      const article = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const attachment = article.attachments.find((a) => a.id == attachmentId);

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Delete physical file
      const diskFile = path.join(this.UPLOAD_DIR, attachment.filename);
      if (fs.existsSync(diskFile)) {
        fs.unlinkSync(diskFile);
      }

      // Remove from article
      article.attachments = article.attachments.filter(
        (a) => a.id != attachmentId
      );
      article.updatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(article, null, 2));

      return attachment;
    } catch (err) {
      throw new Error("Failed to remove attachment");
    }
  }
}

module.exports = ArticleService;
