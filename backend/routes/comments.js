const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const CommentService = require("../services/commentService");
const { Comment, Article } = require("../models");
const { HTTP_STATUS } = require("../constants/errorMessages");

const commentService = new CommentService(Comment, Article);

router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
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

router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id, req.user.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
