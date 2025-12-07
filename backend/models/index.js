const Article = require('./article');
const Comment = require('./comment');
const Workspace = require('./workspace');

// Articles can have multiple comments
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

// Workspaces can have multiple articles
Workspace.hasMany(Article, { foreignKey: 'workspaceId', as: 'articles' });
Article.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });

module.exports = {
  Article,
  Comment,
  Workspace
};
