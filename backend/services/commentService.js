const { ERRORS } = require('../constants/errorMessages');
const { validateCommentData } = require('../utils/validators');
const { handleCommentNotFound } = require('../utils/errorHandlers');

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
        order: [["createdAt", "ASC"]],
        attributes: ["id", "content", "author", "createdAt", "updatedAt"],
      });

      return comments;
    } catch (err) {
      throw new Error(ERRORS.COMMENT_FETCH_FAILED || 'Failed to fetch comments');
    }
  }

  async createComment(articleId, commentData) {
    validateCommentData(commentData);

    try {
      // Verify article exists
      const article = await this.Article.findByPk(articleId);
      if (!article) {
        throw new Error(ERRORS.ARTICLE_NOT_FOUND);
      }

      const comment = await this.Comment.create({
        content: commentData.content.trim(),
        author: (commentData.author || 'Anonymous').trim(),
        articleId,
      });

      return comment;
    } catch (err) {
      if (err.message === ERRORS.ARTICLE_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.COMMENT_CREATE_FAILED);
    }
  }

  async updateComment(commentId, updateData) {
    validateCommentData(updateData);

    try {
      const comment = await this.Comment.findByPk(commentId);
      handleCommentNotFound(comment, commentId);

      const updatedComment = await comment.update({
        content: updateData.content.trim(),
        author: updateData.author ? updateData.author.trim() : comment.author,
      });

      return updatedComment;
    } catch (err) {
      if (err.message === ERRORS.COMMENT_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.COMMENT_UPDATE_FAILED);
    }
  }

  async deleteComment(commentId) {
    try {
      const comment = await this.Comment.findByPk(commentId);
      handleCommentNotFound(comment, commentId);

      await comment.destroy();
      return true;
    } catch (err) {
      if (err.message === ERRORS.COMMENT_NOT_FOUND) {
        throw err;
      }
      throw new Error(ERRORS.COMMENT_DELETE_FAILED);
    }
  }
}

module.exports = CommentService;
