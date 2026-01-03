const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const { router: articleRoutes } = require("./articles");
const commentRoutes = require("./comments");
const workspaceRoutes = require("./workspaces");
const versionRoutes = require("./versions");
const adminRoutes = require("./admin");

router.use("/auth", authRoutes);
router.use("/articles", articleRoutes);
router.use("/comments", commentRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/versions", versionRoutes);
router.use("/admin", adminRoutes);

// Health check endpoints
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

router.get("/health/db", async (req, res) => {
  try {
    const { sequelize } = require("../config/database");
    await sequelize.authenticate();
    res.json({ database: "connected" });
  } catch (err) {
    res.status(500).json({
      database: "disconnected",
      error: err.message,
    });
  }
});

module.exports = router;
