const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Workspace model - categories for organizing articles
const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'workspaces',
  timestamps: true
});

module.exports = Workspace;
