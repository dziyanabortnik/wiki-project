const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
require("dotenv").config({ path: ".env" });

// Config and middleware
const { handleFileUpload } = require("./middleware/upload");
const { authenticateToken, optionalAuth } = require("./middleware/auth");
const errorMiddleware = require("./middleware/errorMiddleware");

// Services
const SocketService = require("./services/socketService");
const ArticleService = require("./services/articleService");
const CommentService = require("./services/commentService");
const WorkspaceService = require("./services/workspaceService");
const AuthService = require("./services/authService");

// Database
const { sequelize } = require("./config/database");
const {
  Article,
  Comment,
  Workspace,
  ArticleVersion,
  User,
} = require("./models");

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
const authService = new AuthService();

// MIDDLEWARE
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

// AUTHENTICATION
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Registration successful",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth/profile", authenticateToken, async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
});

// WORKSPACE ROUTES
app.get("/api/workspaces", async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getAllWorkspaces();
    res.status(HTTP_STATUS.OK).json(workspaces);
  } catch (err) {
    next(err);
  }
});

app.get("/api/workspaces/:id", async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    res.status(HTTP_STATUS.OK).json(workspace);
  } catch (err) {
    next(err);
  }
});

// ARTICLE ROUTES
app.get("/api/articles", optionalAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    const articles = await articleService.getAllArticles(workspaceId);
    res.status(HTTP_STATUS.OK).json(articles);
  } catch (err) {
    next(err);
  }
});

app.get("/api/articles/:id", optionalAuth, async (req, res, next) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.status(HTTP_STATUS.OK).json(article);
  } catch (err) {
    next(err);
  }
});

app.post("/api/articles", authenticateToken, async (req, res, next) => {
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

app.put("/api/articles/:id", authenticateToken, async (req, res, next) => {
  try {
    const updatedArticle = await articleService.updateArticle(
      req.params.id,
      req.body,
      req.user.id
    );

    // WebSocket notifications
    socketService.sendNotification(
      req.params.id,
      `Article "${req.body.title}" was updated by ${req.user.name}`
    );
    socketService.emitToArticle(
      req.params.id,
      "article-updated",
      updatedArticle
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Article updated successfully",
      article: updatedArticle,
    });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/articles/:id", authenticateToken, async (req, res, next) => {
  try {
    await articleService.deleteArticle(req.params.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

// ARTICLE ATTACHMENTS
app.post(
  "/api/articles/:id/attachments",
  authenticateToken,
  handleFileUpload,
  async (req, res, next) => {
    try {
      const { article, attachments } = await articleService.addAttachments(
        req.params.id,
        req.files,
        req.user.id
      );

      // WebSocket notifications
      socketService.emitToArticle(req.params.id, "article-updated", article);

      const message =
        attachments.length === 1
          ? `File attached by ${req.user.name}: ${attachments[0].originalName}`
          : `${attachments.length} files attached by ${req.user.name}`;

      socketService.sendNotification(req.params.id, message);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        attachments,
      });
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
  "/api/articles/:id/attachments/:attachmentId",
  authenticateToken,
  async (req, res, next) => {
    try {
      const attachment = await articleService.removeAttachment(
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
app.get(
  "/api/articles/:id/with-comments",
  optionalAuth,
  async (req, res, next) => {
    try {
      const article = await articleService.getArticleWithComments(
        req.params.id
      );
      res.status(HTTP_STATUS.OK).json(article);
    } catch (err) {
      next(err);
    }
  }
);

// COMMENT ROUTES
app.get("/api/articles/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsByArticleId(req.params.id);
    res.status(HTTP_STATUS.OK).json(comments);
  } catch (err) {
    next(err);
  }
});

app.post(
  "/api/articles/:id/comments",
  authenticateToken,
  async (req, res, next) => {
    try {
      console.log("Creating comment - User ID from token:", req.user.id);
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
  }
);

app.put("/api/comments/:id", authenticateToken, async (req, res, next) => {
  try {
    console.log("Updating comment - User ID:", req.user.id);
    const comment = await commentService.updateComment(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/comments/:id", authenticateToken, async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id, req.user.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

// VERSION ROUTES
app.get("/api/articles/:id/versions", optionalAuth, async (req, res, next) => {
  try {
    const versions = await articleService.getArticleVersions(req.params.id);
    res.status(HTTP_STATUS.OK).json(versions);
  } catch (err) {
    next(err);
  }
});

app.get(
  "/api/articles/:id/versions/:versionNumber",
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

app.post(
  "/api/articles/:id/versions/:versionNumber/restore",
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
      console.log(
        `JWT Secret: ${process.env.JWT_SECRET ? "Set" : "Using default"}`
      );
    });
  } catch (err) {
    databaseLogger.logConnectionError(err);
  }
}

// Start the server
startServer();

module.exports = { app, server, socketService };
