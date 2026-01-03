const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const AuthService = require("../services/authService");
const { HTTP_STATUS } = require("../constants/errorMessages");

const authService = new AuthService();

router.post("/register", async (req, res, next) => {
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

router.post("/login", async (req, res, next) => {
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

router.get("/profile", authenticateToken, async (req, res, next) => {
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

module.exports = router;
