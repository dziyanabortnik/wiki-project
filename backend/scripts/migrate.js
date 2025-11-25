const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require("../config/database");

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Create migration tracking table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Check if migration already applied
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" WHERE name = $1',
      { bind: ["001-create-articles.js"] }
    );

    if (executedMigrations.length === 0) {
      console.log("Applying migration: 001-create-articles.js");

      // Run the migration
      const migration = require("../migrations/001-create-articles");
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

      // Mark as completed
      await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES ($1)', {
        bind: ["001-create-articles.js"],
      });
      
      console.log("Migration applied successfully.");
    } else {
      console.log("Migration already applied. No changes needed.");
    }

    console.log("Database setup completed!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

runMigrations();
