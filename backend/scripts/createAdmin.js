const { sequelize } = require("../config/database");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env" });

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    // Check if ALL required credentials are provided
    if (!adminEmail || !adminPassword) {
      console.error("ERROR: Admin credentials not configured");
      console.log("\nTo create an admin user:");
      console.log("1. Add these to your .env file:");
      console.log("   ADMIN_EMAIL=your_admin@email.com");
      console.log("   ADMIN_PASSWORD=your_secure_password");
      console.log("   ADMIN_NAME=Admin Name");
      console.log("\n2. Run: npm run create-admin");
      process.exit(1);
    }

    // Check if ANY user already exists with this email
    const existingUser = await User.findOne({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.log(`User with email '${adminEmail}' already exists.`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Created: ${existingUser.createdAt.toLocaleDateString()}`);
      
      // Check if it's already an admin
      if (existingUser.role === 'admin') {
        console.log("\nThis user is already an administrator.");
        console.log("   You can login with these credentials.");
        return;
      } else {
        console.log(`\nThis user has role: '${existingUser.role}'`);
        return;
      }
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName || "Admin",
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName || "Admin"}`);
    console.log(`   Password: ${adminPassword}`);
    
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    console.error("Full error:", error);
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
