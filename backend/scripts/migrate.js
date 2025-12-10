const path = require("path");
require('dotenv').config({ path: path.join(__dirname, '..', '.env.BackUp') });

const { sequelize } = require("../config/database");
const databaseLogger = require("../utils/databaseLogger");

require("../models/article");
require("../models/comment");
require("../models/workspace");
require("../models/articleVersion");

async function runMigrations() {
  try {
    await sequelize.authenticate();
    databaseLogger.logConnectionSuccess();

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
    
    databaseLogger.logWorkspacesPopulated();
    databaseLogger.logMigrationSuccess();
  } catch (error) {
    databaseLogger.logMigrationError(error);
  }
}

runMigrations();