/**
 * Quick MongoDB Connection Test
 * 
 * This script helps verify your MongoDB credentials
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log("🔍 Testing MongoDB Connection...");
console.log("📍 Connection String (masked):", uri?.replace(/:[^:@]+@/, ":****@") || "Not found");

if (!uri) {
  console.error("❌ MONGODB_URI not found in .env file");
  process.exit(1);
}

// Extract username from connection string for debugging
const usernameMatch = uri.match(/mongodb\+srv:\/\/([^:]+):/);
if (usernameMatch) {
  console.log("👤 Username in connection string:", usernameMatch[1]);
}

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connection successful!");
    console.log("📊 Database:", mongoose.connection.name);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Connection failed:", error.message);
    
    if (error.message.includes("Authentication failed")) {
      console.log("\n💡 Authentication Error - Possible causes:");
      console.log("1. Wrong username or password");
      console.log("2. Database user not created in MongoDB Atlas");
      console.log("3. User doesn't have access to the database");
      console.log("\n📝 To fix:");
      console.log("1. Go to MongoDB Atlas → Database Access");
      console.log("2. Verify username: amitprakhar14_db_user");
      console.log("3. Reset password if needed");
      console.log("4. Make sure user has 'Read and write to any database' permissions");
    }
    
    process.exit(1);
  });

