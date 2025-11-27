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
        order: [["createdAt", "ASC"]], // Show oldest first
        attributes: ["id", "content", "author", "createdAt", "updatedAt"],
      });

      return comments;
    } catch (err) {
      throw new Error("Failed to fetch comments");
    }
  }

  async createComment(articleId, commentData) {
    const { content, author = "Anonymous" } = commentData;

    if (!content || !content.trim()) {
      throw new Error("Comment content is required");
    }

    try {
      // Verify article exists
      const article = await this.Article.findByPk(articleId);
      if (!article) {
        throw new Error("Article not found");
      }

      const comment = await this.Comment.create({
        content: content.trim(),
        author: author.trim() || "Anonymous",
        articleId,
      });

      return comment;
    } catch (err) {
      if (err.message === "Article not found") {
        throw err;
      }
      throw new Error("Failed to create comment");
    }
  }

  async updateComment(commentId, updateData) {
    const { content, author } = updateData;

    if (!content || !content.trim()) {
      throw new Error("Comment content is required");
    }

    try {
      const comment = await this.Comment.findByPk(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      const updatedComment = await comment.update({
        content: content.trim(),
        author: author ? author.trim() : comment.author,
      });

      return updatedComment;
    } catch (err) {
      if (err.message === "Comment not found") {
        throw err;
      }
      throw new Error("Failed to update comment");
    }
  }

  async deleteComment(commentId) {
    try {
      const comment = await this.Comment.findByPk(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      await comment.destroy();
      return true;
    } catch (err) {
      if (err.message === "Comment not found") {
        throw err;
      }
      throw new Error("Failed to delete comment");
    }
  }
}

module.exports = CommentService;
