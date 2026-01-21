import express from "express";
import {patientRegisterHandler,billGenerateHandler, trackSampleStatusHandler, trackReportStatusHandler } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/crelio/webhook", patientRegisterHandler);
router.post("/crelio/bill-generate", billGenerateHandler);
router.post("/crelio/sample-status", trackSampleStatusHandler);
router.post("/crelio/report-status", trackReportStatusHandler);

export default router;

