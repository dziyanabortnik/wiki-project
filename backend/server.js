const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
require("dotenv").config({ path: ".env" });

// Middleware
const errorMiddleware = require("./middleware/errorMiddleware");
const databaseLogger = require("./utils/databaseLogger");

// Database
const { sequelize } = require("./config/database");

// Services
const SocketService = require("./services/socketService");

// Routes
const mainRouter = require("./routes");
const { setSocketService } = require("./routes/articles");

// Constants
const { HTTP_STATUS, ERRORS } = require("./constants/errorMessages");

// Initialize Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
let socketService;
try {
  socketService = new SocketService(server);
  setSocketService(socketService);
  console.log("Socket.io initialized");
} catch (error) {
  console.error("Failed to initialize SocketService:", error);
  socketService = null;
}

// MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}
app.use("/uploads", express.static(uploadsDir));

app.use("/api", mainRouter);

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
      databaseLogger.logServerStart(PORT, uploadsDir);
      console.log(`Server started on port ${PORT}`);
      console.log(`Uploads directory: ${uploadsDir}`);

      if (!process.env.JWT_SECRET) {
        console.warn("WARNING: JWT_SECRET is not set in .env file!");
        console.warn("Authentication will not work properly.");
      } else {
        console.log("JWT authentication: Ready");
      }
    });
  } catch (err) {
    databaseLogger.logConnectionError(err);
  }
}

// Start the server
startServer();

module.exports = { app, server, socketService };
