const { ERRORS } = require('../constants/errorMessages');

const databaseLogger = {
  logConnectionSuccess: () => {
    console.log('Database connection established successfully.');
  },

  logConnectionError: (error) => {
    console.error(`${ERRORS.DB_CONNECTION_FAILED}:`, error.message);
    process.exit(1);
  },

  logMigrationSuccess: () => {
    console.log('All models synchronized successfully!');
    console.log('Database setup completed!');
  },

  logMigrationError: (error) => {
    console.error(`Database setup failed:`, error.message);
    process.exit(1);
  },

  logServerStart: (port, uploadsDir) => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Uploads directory: ${uploadsDir}`);
  },

  logWorkspacesPopulated: () => {
    console.log('Workspaces populated successfully!');
  }
};

module.exports = databaseLogger;