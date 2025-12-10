'use strict';

// Migration to create article_versions table for versioning
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables();
    
    if (tableExists.includes('article_versions')) {
      console.log('Table article_versions already exists, skipping...');
      return;
    }

    await queryInterface.createTable('article_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      articleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      workspaceId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'system'
      },
      changeReason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('article_versions', ['articleId']);
    await queryInterface.addIndex('article_versions', ['articleId', 'version'], {
      unique: true,
      name: 'article_versions_articleId_version_unique'
    });
    
    console.log('Created article_versions table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('article_versions');
    console.log('Dropped article_versions table');
  }
};
