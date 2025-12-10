const Article = require('./article');
const Comment = require('./comment');
const Workspace = require('./workspace');
const ArticleVersion = require('./articleVersion');

// Articles can have multiple comments
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

// Workspaces can have multiple articles
Workspace.hasMany(Article, { foreignKey: 'workspaceId', as: 'articles' });
Article.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });

// Articles can have multiple versions
Article.hasMany(ArticleVersion, { foreignKey: 'articleId', as: 'versions', onDelete: 'CASCADE'});
ArticleVersion.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

// Article references its latest version
Article.belongsTo(ArticleVersion, { foreignKey: 'latestVersionId', as: 'latestVersion', constraints: false});

module.exports = {
  Article,
  Comment,
  Workspace,
  ArticleVersion
};
