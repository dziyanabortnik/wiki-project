"use strict";

// Migration to add versioning columns to articles table
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("articles");

    // Add currentVersion column if not exists
    if (!tableInfo.currentVersion) {
      await queryInterface.addColumn("articles", "currentVersion", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
      console.log("Added currentVersion column to articles");
    }

    // Add latestVersionId column if not exists
    if (!tableInfo.latestVersionId) {
      await queryInterface.addColumn("articles", "latestVersionId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "article_versions",
          key: "id",
        },
        onDelete: "SET NULL",
      });
      console.log("Added latestVersionId column to articles");
    }

    // Migrate existing articles to versioning system
    console.log("Migrating existing articles to versions...");

    const [articles] = await queryInterface.sequelize.query(
      "SELECT id, title, content, workspaceId, attachments FROM articles",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${articles.length} articles to migrate`);

    for (const article of articles) {
      // Create version 1 for each existing article
      const [versionResult] = await queryInterface.sequelize.query(
        `INSERT INTO article_versions 
         (id, articleId, version, title, content, workspaceId, attachments, createdBy, createdAt, updatedAt)
         VALUES (uuid_generate_v4(), :articleId, 1, :title, :content, :workspaceId, :attachments, 'system', NOW(), NOW())
         RETURNING id`,
        {
          replacements: {
            articleId: article.id,
            title: article.title,
            content: article.content,
            workspaceId: article.workspaceId,
            attachments: JSON.stringify(article.attachments || []),
          },
        }
      );

      // Update article with version reference
      await queryInterface.sequelize.query(
        "UPDATE articles SET latestVersionId = :versionId, currentVersion = 1 WHERE id = :articleId",
        {
          replacements: {
            versionId: versionResult[0].id,
            articleId: article.id,
          },
        }
      );
    }

    console.log("Successfully migrated all articles to versioning system");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("articles", "currentVersion");
    await queryInterface.removeColumn("articles", "latestVersionId");
    console.log("Removed versioning columns from articles");
  },
};
