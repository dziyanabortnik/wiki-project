"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "role", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "user",
    });

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('admin', 'user');
    `);

    await queryInterface.sequelize.query(`
      UPDATE "users" SET role = 'user' WHERE role IS NULL OR role NOT IN ('admin', 'user');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE "enum_users_role" 
      USING "role"::"enum_users_role";
    `);

    await queryInterface.addIndex("users", ["role"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "role");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";'
    );
  },
};
