import express from "express";
import {
  getAllPatients,
  getPatientBillById,
  getPatientTests,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Dashboard statistics
router.get("/patients", getAllPatients);
router.get("/patients/bill", getPatientBillById);
router.get("/patients/tests", getPatientTests);

export default router;

