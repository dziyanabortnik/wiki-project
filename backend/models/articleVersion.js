const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArticleVersion = sequelize.define('ArticleVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  articleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'articles',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  workspaceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'system'
  },
  changeReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'article_versions',
  timestamps: true,
  updatedAt: false
});

module.exports = ArticleVersion;
