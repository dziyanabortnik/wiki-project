const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require("../config/database");

require("../models/article");
require("../models/comment");
require("../models/workspace");

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync all models with database
    await sequelize.sync({ alter: true });
    
    const Workspace = require("../models/workspace");
    
    // Populate workspaces with initial data
    const workspaces = [
      { id: 'uncategorized', name: 'Uncategorized' },
      { id: 'nature', name: 'Nature & Science' },
      { id: 'culture', name: 'Culture & Arts' },
      { id: 'tech', name: 'Technology' },
      { id: 'education', name: 'Education' }
    ];

    // Create workspaces if they don't exist
    for (const ws of workspaces) {
      await Workspace.findOrCreate({
        where: { id: ws.id },
        defaults: ws
      });
    }
    
    console.log("Workspaces populated successfully!");
    console.log("All models synchronized successfully!");
    console.log("Database setup completed!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

runMigrations();