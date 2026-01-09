const { sequelize } = require("../config/database");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env" });

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    const existingAdmin = await User.findOne({
      where: { email: "admin@wiki.com" },
    });

    // Default admin credentials
    const adminEmail = "admin@wiki.com";
    const adminPassword = "Admin123!";
    const adminName = "System Administrator";

    // If admin user exists, show information with password
    if (existingAdmin) {
      console.log("ADMIN USER EXISTS");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Name: ${existingAdmin.name}`);
      console.log(`Role: ${existingAdmin.role}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Created: ${existingAdmin.createdAt.toLocaleDateString()}`);

      return;
    }

    // Create new admin user if doesn't exist
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: "admin",
    });

    console.log("ADMIN USER CREATED");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Name: ${adminName}`);
  } catch (error) {
    console.error("Error during admin user creation:", error.message);

    if (error.name === "SequelizeConnectionError") {
      console.log("Database connection failed. Please check:");
      console.log("1. Is PostgreSQL running?");
      console.log("2. Are database credentials in .env file correct?");
      console.log("3. Does the database 'wiki_dev' exist?");
    }

    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

module.exports = createAdminUser;

// Execute function if script is run directly
if (require.main === module) {
  createAdminUser();
}
