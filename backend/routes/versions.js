const express = require("express");
const router = express.Router();
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const ArticleService = require("../services/articleService");
const { Article, ArticleVersion } = require("../models");
const path = require("path");
const { HTTP_STATUS } = require("../constants/errorMessages");

const articleService = new ArticleService(
  Article,
  ArticleVersion,
  path.join(__dirname, "../uploads")
);

router.get("/:id/versions", optionalAuth, async (req, res, next) => {
  try {
    const versions = await articleService.getArticleVersions(req.params.id);
    res.status(HTTP_STATUS.OK).json(versions);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id/versions/:versionNumber",
  optionalAuth,
  async (req, res, next) => {
    try {
      const version = await articleService.getArticleVersion(
        req.params.id,
        parseInt(req.params.versionNumber)
      );

      const response = version.toJSON();
      response.isHistorical = true;

      res.status(HTTP_STATUS.OK).json(response);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/versions/:versionNumber/restore",
  authenticateToken,
  async (req, res, next) => {
    try {
      const oldVersion = await articleService.getArticleVersion(
        req.params.id,
        parseInt(req.params.versionNumber)
      );

      const result = await articleService.createArticleVersion(req.params.id, {
        title: oldVersion.title,
        content: oldVersion.content,
        workspaceId: oldVersion.workspaceId,
        attachments: oldVersion.attachments,
        userId: req.user.id,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Article restored from version",
        article: result.article,
        restoredFromVersion: oldVersion.version,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
