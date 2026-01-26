import express from "express";
import {
  getAllPatients,
  getPatientBillById,
  getPatientTests,
  getPatientReports,
  getPatientReportStatus,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Dashboard statistics
router.get("/patients", getAllPatients);
router.get("/patients/bill", getPatientBillById);
router.get("/patients/tests", getPatientTests);
router.get("/patients/reports", getPatientReports);
router.get("/patients/report-status", getPatientReportStatus);
export default router;

