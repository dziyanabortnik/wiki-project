const { ERRORS } = require("../constants/errorMessages");
const { validateCommentData } = require("../utils/validators");
const { handleCommentNotFound } = require("../utils/errorHandlers");

class CommentService {
  constructor(CommentModel, ArticleModel) {
    this.Comment = CommentModel;
    this.Article = ArticleModel;
  }

  // Get all comments for an article
  async getCommentsByArticleId(articleId) {
    try {
      const comments = await this.Comment.findAll({
        where: { articleId },
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "ASC"]],
        attributes: [
          "id",
          "content",
          "author",
          "createdAt",
          "updatedAt",
          "userId",
        ],
      });

      // Ensure author field is populated from user if available
      const commentsWithAuthor = comments.map((comment) => {
        const commentData = comment.toJSON();
        if (commentData.user && commentData.user.name) {
          commentData.author = commentData.user.name;
        }
        return commentData;
      });

      return commentsWithAuthor;
    } catch (err) {
      throw new Error(
        ERRORS.COMMENT_FETCH_FAILED || "Failed to fetch comments"
      );
    }
  }

  async createComment(articleId, commentData, userId) {
    validateCommentData(commentData);

    try {
      const article = await this.Article.findByPk(articleId);
      if (!article) {
        throw new Error(ERRORS.ARTICLE_NOT_FOUND);
      }

      console.log("Creating comment for user ID:", userId);

      // Get user information
      let authorName = "User";
      let userData = null;

      if (userId) {
        const User = require("../models/user");
        userData = await User.findByPk(userId);
        if (userData) {
          authorName = userData.name;
          console.log("User found:", userData.name);
        }
      }

      const comment = await this.Comment.create({
        content: commentData.content.trim(),
        author: authorName,
        articleId,
        userId: userId || null,
      });

      console.log("Comment created with ID:", comment.id);

      // Load comment with user information
      const commentWithUser = await this.Comment.findByPk(comment.id, {
        include: [
          {
            model: require("../models/user"),
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      const result = commentWithUser.toJSON();
      console.log("Returning comment data:", result);

      return result;
    } catch (err) {
      console.error("Error in createComment:", err);
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.COMMENT_CREATE_FAILED);
    }
  }

  async updateComment(commentId, updateData, userId) {
    validateCommentData(updateData);

    try {
      const comment = await this.Comment.findByPk(commentId);
      handleCommentNotFound(comment, commentId);

      // Check if user owns the comment
      if (comment.userId && comment.userId !== userId) {
        throw new Error("You can only edit your own comments");
      }

      // Get updated author name from user if available
      let authorName = comment.author;
      if (userId) {
        const User = require("../models/user");
        const user = await User.findByPk(userId);
        if (user) {
          authorName = user.name;
        }
      }

      const updatedComment = await comment.update({
        content: updateData.content.trim(),
        author: authorName,
        userId: userId || comment.userId, // Preserve or set userId
      });

      // Return updated comment with user info
      return await this.getCommentWithUser(commentId);
    } catch (err) {
      if (err.message === ERRORS.COMMENT_NOT_FOUND) {
        throw err;
      }
      throw new Error(err.message || ERRORS.COMMENT_UPDATE_FAILED);
    }
  }

  async deleteComment(commentId, userId) {
    try {
      const comment = await this.Comment.findByPk(commentId);
      handleCommentNotFound(comment, commentId);

      // Check if user owns the comment
      if (comment.userId && comment.userId !== userId) {
        throw new Error("You can only delete your own comments");
      }

      await comment.destroy();
      return true;
    } catch (err) {
      if (err.message === ERRORS.COMMENT_NOT_FOUND) {
        throw err;
      }
      throw new Error(err.message || ERRORS.COMMENT_DELETE_FAILED);
    }
  }

  async getCommentWithUser(commentId) {
    const comment = await this.Comment.findByPk(commentId, {
      include: [
        {
          model: require("../models/user"),
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!comment) {
      throw new Error(ERRORS.COMMENT_NOT_FOUND);
    }

    const commentData = comment.toJSON();
    // Ensure author field is populated from user if available
    if (commentData.user && commentData.user.name) {
      commentData.author = commentData.user.name;
    }

    return commentData;
  }
}

module.exports = CommentService;
