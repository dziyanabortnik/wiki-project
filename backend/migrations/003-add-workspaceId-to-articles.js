'use strict';

// Migration to add workspaceId column to articles table
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articles', 'workspaceId', {
      type: Sequelize.STRING,
      allowNull: true // Allow articles without workspace
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('articles', 'workspaceId');
  }
};
