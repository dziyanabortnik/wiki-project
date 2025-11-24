const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { sequelize } = require('../config/database');
const Article = require('../models/article');

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ force: false });
    console.log('All models were synchronized successfully.');

    console.log('Database setup completed.');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

runMigrations();
