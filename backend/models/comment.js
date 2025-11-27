const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Comment model - user comments on articles
const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Anonymous',
    validate: {
      notEmpty: true
    }
  },
  articleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'articles',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comments',
  timestamps: true
});

// Define associations between Comment and Article
const Article = require('./article');
Comment.belongsTo(Article, { foreignKey: 'articleId' });
Article.hasMany(Comment, { foreignKey: 'articleId', onDelete: 'CASCADE' });

module.exports = Comment;
