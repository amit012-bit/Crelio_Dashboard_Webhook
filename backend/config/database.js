/**
 * Database Configuration Module
 * 
 * This module handles MongoDB connection using Mongoose.
 * It connects to MongoDB Atlas using the connection string from environment variables.
 * 
 * Features:
 * - Automatic reconnection on connection loss
 * - Connection state logging
 * - Error handling
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Connect to MongoDB Atlas
 * 
 * This function establishes a connection to MongoDB Atlas using the connection string
 * from the MONGODB_URI environment variable.
 * 
 * @returns {Promise<void>} - Resolves when connection is established
 */
export const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;

    // Check if connection string is provided
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Connect to MongoDB
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+
    // They are no longer needed and are automatically handled
    const conn = await mongoose.connect(mongoURI);

    // Log successful connection
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });

    return conn;
  } catch (error) {
    // Log error and exit process if connection fails
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * 
 * Gracefully closes the MongoDB connection.
 * Useful for cleanup during application shutdown.
 * 
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error.message);
  }
};

