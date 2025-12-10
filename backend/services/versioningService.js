const { ERRORS } = require('../constants/errorMessages');

class VersioningService {
  constructor(ArticleModel, ArticleVersionModel) {
    this.Article = ArticleModel;
    this.ArticleVersion = ArticleVersionModel;
  }

  async createArticleVersion(articleId, versionData) {
    try {
      const article = await this.Article.findByPk(articleId);
      if (!article) {
        throw new Error(ERRORS.ARTICLE_NOT_FOUND);
      }

      const newVersionNumber = article.currentVersion + 1;

      const newVersion = await this.ArticleVersion.create({
        articleId,
        version: newVersionNumber,
        title: versionData.title,
        content: versionData.content,
        workspaceId: versionData.workspaceId || article.workspaceId,
        attachments: versionData.attachments || article.attachments || [],
        createdBy: versionData.createdBy || 'system',
        changeReason: versionData.changeReason
      });

      await article.update({
        title: versionData.title,
        content: versionData.content,
        workspaceId: versionData.workspaceId || article.workspaceId,
        attachments: versionData.attachments || article.attachments || [],
        currentVersion: newVersionNumber,
        latestVersionId: newVersion.id
      });

      return {
        article,
        version: newVersion
      };
    } catch (error) {
      console.error('Error creating article version:', error);
      throw new Error('Failed to create article version');
    }
  }

  async getArticleVersions(articleId) {
    try {
      const versions = await this.ArticleVersion.findAll({
        where: { articleId },
        order: [['version', 'DESC']],
        attributes: ['id', 'version', 'title', 'createdBy', 'changeReason', 'createdAt']
      });

      return versions;
    } catch (error) {
      console.error('Error fetching article versions:', error);
      throw new Error('Failed to fetch article versions');
    }
  }

  async getArticleVersion(articleId, versionNumber) {
    try {
      const version = await this.ArticleVersion.findOne({
        where: { 
          articleId, 
          version: versionNumber 
        },
        include: [{
          model: this.Article,
          as: 'article',
          attributes: ['id', 'currentVersion']
        }]
      });

      if (!version) {
        throw new Error('Article version not found');
      }

      return version;
    } catch (error) {
      if (error.message === 'Article version not found') {
        throw error;
      }
      console.error('Error fetching article version:', error);
      throw new Error('Failed to fetch article version');
    }
  }
}

module.exports = VersioningService;
