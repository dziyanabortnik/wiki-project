const { ERRORS } = require("../constants/errorMessages");
const {
  handleArticleNotFound,
  handleAttachmentNotFound,
} = require("../utils/errorHandlers");
const {
  validateArticleData,
  validateAttachmentFiles,
} = require("../utils/validators");
const {
  deleteAttachmentFiles,
  createAttachmentObjects,
} = require("../utils/fileHelpers");
const fs = require("fs");
const path = require("path");

class ArticleService {
  constructor(ArticleModel, uploadDir) {
    this.Article = ArticleModel;
    this.uploadDir = uploadDir;
    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Get all articles, optionally filtered by workspace
  async getAllArticles(workspaceId = null) {
    try {
      const whereClause = workspaceId ? { workspaceId } : {};

      const articles = await this.Article.findAll({
        where: whereClause,
        attributes: ["id", "title", "updatedAt", "workspaceId", "attachments"],
        order: [["updatedAt", "DESC"]],
      });

      return articles.map((article) => ({
        id: article.id,
        title: article.title,
        attachments: article.attachments || [],
        workspaceId: article.workspaceId,
        updatedAt: article.updatedAt,
      }));
    } catch (err) {
      console.error("Error fetching articles:", err);
      throw new Error(ERRORS.ARTICLE_FETCH_FAILED);
    }
  }

  async getArticleById(id) {
    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);
      return article;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.ARTICLE_FETCH_FAILED);
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
        title: articleData.title.trim(),
        content: articleData.content,
        workspaceId: articleData.workspaceId || null,
        attachments: [],
      });
      return article;
    } catch (err) {
      console.error("Database error:", err);
      throw new Error(ERRORS.ARTICLE_CREATE_FAILED);
    }
  }

  async updateArticle(id, updateData) {
    validateArticleData(updateData);

    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      const updatedArticle = await article.update({
        title: updateData.title.trim(),
        content: updateData.content,
        workspaceId: updateData.workspaceId || article.workspaceId,
      });

      return updatedArticle;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.ARTICLE_UPDATE_FAILED);
    }
  }

  async deleteArticle(id) {
    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      const Comment = require("../models/comment");
      await Comment.destroy({
        where: { articleId: id },
      });

      deleteAttachmentFiles(article.attachments, this.uploadDir);
      await article.destroy();

      return true;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.ARTICLE_DELETE_FAILED);
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
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.ATTACHMENT_UPLOAD_FAILED);
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
      const diskFile = path.join(this.uploadDir, attachment.filename);
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
        err.message === ERRORS.ARTICLE_NOT_FOUND ||
        err.message === ERRORS.ATTACHMENT_NOT_FOUND
      ) {
        throw err;
      }
      throw new Error(ERRORS.ATTACHMENT_REMOVE_FAILED);
    }
  }

  async getArticleWithComments(articleId) {
    try {
      const article = await this.Article.findByPk(articleId, {
        include: [
          {
            model: require("../models/comment"),
            as: "comments",
            attributes: ["id", "content", "author", "createdAt", "updatedAt"],
            order: [["createdAt", "ASC"]],
          },
        ],
      });

      if (!article) {
        throw new Error(ERRORS.ARTICLE_NOT_FOUND);
      }
      return article;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error("Failed to fetch article with comments");
    }
  }
}

module.exports = ArticleService;
