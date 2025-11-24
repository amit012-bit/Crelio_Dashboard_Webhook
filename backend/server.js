/**
 * Express Server Entry Point
 * 
 * This is the main server file that sets up the Express application,
 * connects to MongoDB, and configures all routes and middleware.
 * 
 * Features:
 * - MongoDB connection
 * - Express server setup
 * - CORS configuration
 * - Route handling
 * - Error handling
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Get frontend URL for CORS
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Middleware
// Enable CORS for frontend
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Parse JSON bodies (with increased limit for large PDF base64 data)
app.use(express.json({ limit: "50mb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Webhook routes (for receiving data from Node.js-Webhook-on-Render)
app.use("/api/webhook", webhookRoutes);

// Dashboard routes (for frontend data)
app.use("/api/dashboard", dashboardRoutes);

// 404 handler (must be after all routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook/crelio`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Close server gracefully
  process.exit(1);
});

// Handle SIGTERM (for graceful shutdown)
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

