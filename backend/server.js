const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");

// Config and middleware
const { handleFileUpload } = require("./middleware/upload");
const errorMiddleware = require("./middleware/errorMiddleware");
require("dotenv").config({ path: ".env.BackUp" });

// Services
const SocketService = require("./services/socketService");
const ArticleService = require("./services/articleService");
const CommentService = require("./services/commentService");
const WorkspaceService = require("./services/workspaceService");

// Database
const { sequelize } = require("./config/database");
const { Article, Comment, Workspace, ArticleVersion } = require("./models");

// Constants
const { ERRORS, HTTP_STATUS } = require("./constants/errorMessages");

const databaseLogger = require("./utils/databaseLogger");

// Initialize Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize services
const socketService = new SocketService(server);
const articleService = new ArticleService(
  Article,
  ArticleVersion,
  path.join(__dirname, "uploads")
);
const commentService = new CommentService(Comment, Article);
const workspaceService = new WorkspaceService(Workspace);

//MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Database health check
app.get("/health/db", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ database: "connected" });
  } catch (err) {
    res.status(500).json({
      database: "disconnected",
      error: err.message,
    });
  }
});

// WORKSPACE ROUTES
app.get("/workspaces", async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getAllWorkspaces();
    res.status(HTTP_STATUS.OK).json(workspaces);
  } catch (err) {
    next(err);
  }
});

app.get("/workspaces/:id", async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    res.status(HTTP_STATUS.OK).json(workspace);
  } catch (err) {
    next(err);
  }
});

// ARTICLE ROUTES
app.get("/articles", async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    const articles = await articleService.getAllArticles(workspaceId);
    res.status(HTTP_STATUS.OK).json(articles);
  } catch (err) {
    next(err);
  }
});

app.get("/articles/:id", async (req, res, next) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.status(HTTP_STATUS.OK).json(article);
  } catch (err) {
    next(err);
  }
});

app.post("/articles", async (req, res, next) => {
  try {
    const article = await articleService.createArticle({
      ...req.body,
      workspaceId: req.body.workspaceId || null,
    });
    res.status(HTTP_STATUS.CREATED).json(article);
  } catch (err) {
    next(err);
  }
});

app.put("/articles/:id", async (req, res, next) => {
  try {
    const updatedArticle = await articleService.updateArticle(
      req.params.id,
      req.body
    );

    // WebSocket notifications
    socketService.sendNotification(
      req.params.id,
      `Article "${req.body.title}" was updated`
    );
    socketService.emitToArticle(
      req.params.id,
      "article-updated",
      updatedArticle
    );

    res.status(HTTP_STATUS.OK).json(updatedArticle);
  } catch (err) {
    next(err);
  }
});

app.delete("/articles/:id", async (req, res, next) => {
  try {
    await articleService.deleteArticle(req.params.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

// ARTICLE ATTACHMENTS
app.post(
  "/articles/:id/attachments",
  handleFileUpload,
  async (req, res, next) => {
    try {
      const { article, attachments } = await articleService.addAttachments(
        req.params.id,
        req.files
      );

      // WebSocket notifications
      socketService.emitToArticle(req.params.id, "article-updated", article);

      const message =
        attachments.length === 1
          ? `File attached: ${attachments[0].originalName}`
          : `${attachments.length} files attached`;

      socketService.sendNotification(req.params.id, message);

      res.status(HTTP_STATUS.OK).json({ attachments });
    } catch (err) {
      // Cleanup uploaded files on error
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          const filePath = path.join(__dirname, "uploads", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      next(err);
    }
  }
);

app.delete(
  "/articles/:id/attachments/:attachmentId",
  async (req, res, next) => {
    try {
      const attachment = await articleService.removeAttachment(
        req.params.id,
        req.params.attachmentId
      );

      // WebSocket notifications
      socketService.sendNotification(
        req.params.id,
        `Attachment removed: ${attachment.originalName}`
      );

      const article = await articleService.getArticleById(req.params.id);
      socketService.emitToArticle(req.params.id, "article-updated", article);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
);

// ARTICLE WITH COMMENTS
app.get("/articles/:id/with-comments", async (req, res, next) => {
  try {
    const article = await articleService.getArticleWithComments(req.params.id);
    res.status(HTTP_STATUS.OK).json(article);
  } catch (err) {
    next(err);
  }
});

// COMMENT ROUTES
app.get("/articles/:id/comments", async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByArticleId(req.params.id);
    res.status(HTTP_STATUS.OK).json(comments);
  } catch (err) {
    next(err);
  }
});

app.post("/articles/:id/comments", async (req, res, next) => {
  try {
    const comment = await commentService.createComment(req.params.id, req.body);
    res.status(HTTP_STATUS.CREATED).json(comment);
  } catch (err) {
    next(err);
  }
});

app.put("/comments/:id", async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(comment);
  } catch (err) {
    next(err);
  }
});

app.delete("/comments/:id", async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

// VERSION ROUTES
app.get("/articles/:id/versions", async (req, res, next) => {
  try {
    const versions = await articleService.getArticleVersions(req.params.id);
    res.status(HTTP_STATUS.OK).json(versions);
  } catch (err) {
    next(err);
  }
});

app.get("/articles/:id/versions/:versionNumber", async (req, res, next) => {
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
});

app.post(
  "/articles/:id/versions/:versionNumber/restore",
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
      });

      res.status(HTTP_STATUS.OK).json({
        message: "Article restored from version",
        article: result.article,
        restoredFromVersion: oldVersion.version,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ERROR HANDLING
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    error: ERRORS.ARTICLE_NOT_FOUND,
  });
});

// Global error handler
app.use(errorMiddleware);

// DATABASE & SERVER START
async function startServer() {
  try {
    await sequelize.authenticate();
    databaseLogger.logConnectionSuccess();

    server.listen(PORT, () => {
      databaseLogger.logServerStart(PORT, path.join(__dirname, "uploads"));
    });
  } catch (err) {
    databaseLogger.logConnectionError(err);
  }
}

// Start the server
startServer();

module.exports = { app, server, socketService };
