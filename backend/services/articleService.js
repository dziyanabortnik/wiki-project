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

// Main service for article operations including versioning
class ArticleService {
  constructor(ArticleModel, ArticleVersionModel, uploadDir) {
    this.Article = ArticleModel;
    this.ArticleVersion = ArticleVersionModel;
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
        attributes: [
          "id",
          "title",
          "updatedAt",
          "workspaceId",
          "attachments",
          "userId",
        ],
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      return articles.map((article) => ({
        id: article.id,
        title: article.title,
        attachments: article.attachments || [],
        workspaceId: article.workspaceId,
        updatedAt: article.updatedAt,
        userId: article.userId,
        userName: article.user ? article.user.name : "User",
      }));
    } catch (err) {
      console.error("Error fetching articles:", err);
      throw new Error(ERRORS.ARTICLE_FETCH_FAILED);
    }
  }

  async getArticleById(id) {
    try {
      const article = await this.Article.findByPk(id, {
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });
      handleArticleNotFound(article, id);
      return article;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.ARTICLE_FETCH_FAILED);
    }
  }

  async createArticle(articleData, userId) {
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
        currentVersion: 1,
        userId: userId,
      });

      const version = await this.ArticleVersion.create({
        articleId: article.id,
        version: 1,
        title: articleData.title.trim(),
        content: articleData.content,
        workspaceId: articleData.workspaceId || null,
        attachments: [],
        createdBy: userId ? "user" : "system",
        userId: userId,
      });

      await article.update({
        latestVersionId: version.id,
      });

      return article;
    } catch (err) {
      console.error("Database error:", err);
      throw new Error(ERRORS.ARTICLE_CREATE_FAILED);
    }
  }

  async updateArticle(id, updateData, userId, userRole) {
    validateArticleData(updateData);

    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      if (userRole !== "admin" && article.userId !== userId) {
        throw new Error(ERRORS.NOT_ARTICLE_OWNER);
      }

      const result = await this.createArticleVersion(id, {
        title: updateData.title.trim(),
        content: updateData.content,
        workspaceId: updateData.workspaceId || article.workspaceId,
        attachments: article.attachments || [],
        createdBy: "user",
        userId: userId,
      });

      return {
        ...result.article.toJSON(),
        version: result.version.version,
      };
    } catch (err) {
      if (
        err.message === ERRORS.ARTICLE_NOT_FOUND ||
        err.message === ERRORS.NOT_ARTICLE_OWNER
      ) {
        throw err;
      }
      console.error("Update article error:", err);
      throw new Error(ERRORS.ARTICLE_UPDATE_FAILED);
    }
  }

  // Create new version of article
  async createArticleVersion(articleId, versionData) {
    try {
      const article = await this.Article.findByPk(articleId);
      if (!article) {
        throw new Error("Article not found");
      }

      const newVersionNumber = (article.currentVersion || 0) + 1;

      const newVersion = await this.ArticleVersion.create({
        articleId,
        version: newVersionNumber,
        title: versionData.title.trim(),
        content: versionData.content,
        workspaceId: versionData.workspaceId || article.workspaceId,
        attachments: versionData.attachments || article.attachments || [],
        createdBy: versionData.createdBy || "system",
        userId: versionData.userId,
      });

      await article.update({
        title: versionData.title.trim(),
        content: versionData.content,
        workspaceId: versionData.workspaceId || article.workspaceId,
        attachments: versionData.attachments || article.attachments || [],
        currentVersion: newVersionNumber,
        latestVersionId: newVersion.id,
        userId: versionData.userId || article.userId,
      });

      return {
        article: await this.Article.findByPk(articleId, {
          include: [
            {
              model: require("../models/user"),
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        }),
        version: newVersion,
      };
    } catch (error) {
      console.error("Error creating article version:", error);
      throw new Error("Failed to create article version");
    }
  }

  // Get all versions of an article
  async getArticleVersions(articleId) {
    try {
      const versions = await this.ArticleVersion.findAll({
        where: { articleId },
        order: [["version", "DESC"]],
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        attributes: [
          "id",
          "version",
          "title",
          "createdBy",
          "createdAt",
          "userId",
        ],
      });

      return versions;
    } catch (error) {
      console.error("Error fetching article versions:", error);
      throw new Error("Failed to fetch article versions");
    }
  }

  // Get specific version of article
  async getArticleVersion(articleId, versionNumber) {
    try {
      const version = await this.ArticleVersion.findOne({
        where: {
          articleId,
          version: versionNumber,
        },
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!version) {
        throw new Error("Article version not found");
      }

      return version;
    } catch (error) {
      if (error.message === "Article version not found") {
        throw error;
      }
      console.error("Error fetching article version:", error);
      throw new Error("Failed to fetch article version");
    }
  }

  // Delete article and all its versions
  async deleteArticle(id, userId, userRole) {
    try {
      const article = await this.Article.findByPk(id);
      handleArticleNotFound(article, id);

      if (userRole !== "admin" && article.userId !== userId) {
        throw new Error(ERRORS.NOT_ARTICLE_OWNER);
      }

      await this.ArticleVersion.destroy({
        where: { articleId: id },
      });

      const Comment = require("../models/comment");
      await Comment.destroy({
        where: { articleId: id },
      });

      deleteAttachmentFiles(article.attachments, this.uploadDir);
      await article.destroy();

      return true;
    } catch (err) {
      if (
        err.message === ERRORS.ARTICLE_NOT_FOUND ||
        err.message === ERRORS.NOT_ARTICLE_OWNER
      ) {
        throw err;
      }
      throw new Error(ERRORS.ARTICLE_DELETE_FAILED);
    }
  }

  async addAttachments(articleId, files, userId) {
    validateAttachmentFiles(files);

    try {
      const article = await this.Article.findByPk(articleId);
      handleArticleNotFound(article, articleId);

      const newAttachments = createAttachmentObjects(files);
      const currentAttachments = article.attachments || [];
      const updatedAttachments = [...currentAttachments, ...newAttachments];

      await article.update({
        attachments: updatedAttachments,
        userId: userId || article.userId,
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
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
          {
            model: require("../models/comment"),
            as: "comments",
            include: [
              {
                model: require("../models/user"),
                as: "user",
                attributes: ["id", "name", "email"],
              },
            ],
            attributes: [
              "id",
              "content",
              "author",
              "createdAt",
              "updatedAt",
              "userId",
            ],
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
