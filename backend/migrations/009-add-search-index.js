"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add index on article titles for faster search queries
    await queryInterface.addIndex("articles", ["title"], {
      name: "articles_title_idx",
    });

    console.log("Search indexes added for better performance");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("articles", "articles_title_idx");
  },
};
