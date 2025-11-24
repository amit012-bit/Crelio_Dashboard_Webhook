/**
 * Dashboard Routes
 * 
 * This module defines routes for dashboard API endpoints.
 * These endpoints provide data for the frontend dashboard.
 */

import express from "express";
import {
  getDashboardStats,
  getTodayPatients,
  getPatientsByStatus,
  getAllPatients,
  getPatientById,
  getAllDoctors,
  getRecentReports,
  getActivityData,
  getSuccessStats,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Dashboard statistics
router.get("/stats", getDashboardStats);

// Patient routes
router.get("/patients/today", getTodayPatients);
router.get("/patients/status/:status", getPatientsByStatus);
router.get("/patients", getAllPatients);
router.get("/patients/:id", getPatientById);

// Doctor routes
router.get("/doctors", getAllDoctors);

// Report routes
router.get("/reports/recent", getRecentReports);

// Analytics routes
router.get("/activity", getActivityData);
router.get("/success-stats", getSuccessStats);

export default router;

