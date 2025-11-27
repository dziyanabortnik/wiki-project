const fs = require("fs");
const path = require("path");
const {
  validateArticleData,
  validateAttachmentFiles,
} = require("../utils/validators");
const {
  handleArticleNotFound,
  handleAttachmentNotFound,
} = require("../utils/errorHandlers");
const {
  deleteAttachmentFiles,
  createAttachmentObjects,
} = require("../utils/fileHelpers");

// Service class for article business logic
class ArticleService {
  constructor(ArticleModel, uploadDir) {
    this.Article = ArticleModel;
    this.UPLOAD_DIR = uploadDir;
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  // Get all articles, optionally filtered by workspace
  async getAllArticles(workspaceId = null) {
    try {
      const whereClause = workspaceId ? { workspaceId } : {};

      console.log("Fetching articles with filter:", whereClause);

      const articles = await this.Article.findAll({
        where: whereClause,
        attributes: ["id", "title", "updatedAt", "workspaceId", "attachments"],
        order: [["updatedAt", "DESC"]], // Show newest first
      });

      console.log(
        `Found ${articles.length} articles for workspace: ${workspaceId}`
      );

      return articles.map((article) => ({
        id: article.id,
        title: article.title,
        attachments: article.attachments || [],
        workspaceId: article.workspaceId,
      }));
    } catch (err) {
      console.error("Error fetching articles:", err);
      throw new Error("Failed to read articles");
    }
  }
  
  async getArticleById(id) {
    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);
      return article;
    } catch (err) {
      if (err.message === "Article not found") {
        throw err;
      }
      throw new Error("Failed to read article");
    }
  }

  async createArticle(articleData) {
    validateArticleData(articleData);

    try {
      console.log(
        "Creating article with workspaceId:",
        articleData.workspaceId
      );

      const article = await this.Article.create({
        title: articleData.title,
        content: articleData.content,
        workspaceId: articleData.workspaceId || null,
        attachments: [],
      });
      return article;
    } catch (err) {
      console.error("Database error:", err);
      throw new Error("Failed to save article");
    }
  }

  async updateArticle(id, updateData) {
    validateArticleData(updateData);

    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      const updatedArticle = await article.update({
        title: updateData.title,
        content: updateData.content,
        workspaceId: updateData.workspaceId || article.workspaceId,
      });

      return updatedArticle;
    } catch (err) {
      if (err.message === "Article not found") {
        throw err;
      }
      throw new Error("Failed to update article");
    }
  }

  async deleteArticle(id) {
    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      deleteAttachmentFiles(article.attachments, this.UPLOAD_DIR);
      await article.destroy();

      return true;
    } catch (err) {
      if (err.message === "Article not found") {
        throw err;
      }
      throw new Error("Failed to delete article");
    }
  }

  async addAttachments(articleId, files) {
    validateAttachmentFiles(files);

    try {
      const article = await this.Article.findByPk(articleId);
      handleArticleNotFound(article, articleId);

      const newAttachments = createAttachmentObjects(files);
      const currentAttachments = article.attachments || [];
      const updatedAttachments = [...currentAttachments, ...newAttachments];

      await article.update({
        attachments: updatedAttachments,
      });

      return { article, attachments: newAttachments };
    } catch (err) {
      if (err.message === "Article not found") {
        throw err;
      }
      throw new Error("Failed to add attachments: " + err.message);
    }
  }

  async removeAttachment(articleId, attachmentId) {
    try {
      const article = await this.Article.findByPk(articleId);
      handleArticleNotFound(article, articleId);

      const attachment = (article.attachments || []).find(
        (a) => a.id == attachmentId
      );
      handleAttachmentNotFound(attachment, attachmentId);

      // Delete physical file
      const diskFile = path.join(this.UPLOAD_DIR, attachment.filename);
      if (fs.existsSync(diskFile)) {
        fs.unlinkSync(diskFile);
      }

      // Remove from article attachments
      const updatedAttachments = (article.attachments || []).filter(
        (a) => a.id != attachmentId
      );

      await article.update({
        attachments: updatedAttachments,
      });

      return attachment;
    } catch (err) {
      if (
        err.message === "Article not found" ||
        err.message === "Attachment not found"
      ) {
        throw err;
      }
      throw new Error("Failed to remove attachment");
    }
  }
}

module.exports = ArticleService;
