const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { requireArticleOwnerOrAdmin } = require("../middleware/roleMiddleware");
const { handleFileUpload } = require("../middleware/upload");
const ArticleService = require("../services/articleService");
const CommentService = require("../services/commentService");
const { Article, Comment, ArticleVersion } = require("../models");
const { HTTP_STATUS } = require("../constants/errorMessages");

const articleService = new ArticleService(
  Article,
  ArticleVersion,
  path.join(__dirname, "../uploads")
);
const commentService = new CommentService(Comment, Article);

let socketService;

const setSocketService = (service) => {
  socketService = service;
};

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    const articles = await articleService.getAllArticles(workspaceId);
    res.status(HTTP_STATUS.OK).json(articles);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.status(HTTP_STATUS.OK).json(article);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const article = await articleService.createArticle(req.body, req.user.id);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Article created successfully",
      article,
    });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  authenticateToken,
  requireArticleOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const updatedArticle = await articleService.updateArticle(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );

      if (socketService) {
        socketService.sendNotification(
          req.params.id,
          `Article "${req.body.title}" was updated by ${req.user.name}`
        );
        socketService.emitToArticle(
          req.params.id,
          "article-updated",
          updatedArticle
        );
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Article updated successfully",
        article: updatedArticle,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  requireArticleOwnerOrAdmin,
  async (req, res, next) => {
    try {
      await articleService.deleteArticle(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/attachments",
  authenticateToken,
  handleFileUpload,
  async (req, res, next) => {
    try {
      const { article, attachments } = await articleService.addAttachments(
        req.params.id,
        req.files,
        req.user.id
      );

      if (socketService) {
        socketService.emitToArticle(req.params.id, "article-updated", article);

        const message =
          attachments.length === 1
            ? `File attached by ${req.user.name}: ${attachments[0].originalName}`
            : `${attachments.length} files attached by ${req.user.name}`;

        socketService.sendNotification(req.params.id, message);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        attachments,
      });
    } catch (err) {
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          const filePath = path.join(__dirname, "../uploads", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      next(err);
    }
  }
);

router.delete(
  "/:id/attachments/:attachmentId",
  authenticateToken,
  async (req, res, next) => {
    try {
      await articleService.removeAttachment(
        req.params.id,
        req.params.attachmentId
      );
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
);

// ARTICLE WITH COMMENTS
router.get("/:id/with-comments", optionalAuth, async (req, res, next) => {
  try {
    const article = await articleService.getArticleWithComments(req.params.id);
    res.status(HTTP_STATUS.OK).json(article);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByArticleId(req.params.id);
    res.status(HTTP_STATUS.OK).json(comments);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/comments", authenticateToken, async (req, res, next) => {
  try {
    const comment = await commentService.createComment(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, setSocketService };
