/**
 * Webhook Routes
 * 
 * This module defines routes for webhook endpoints.
 * Webhooks receive data from external services (like Node.js-Webhook-on-Render).
 */

import express from "express";
import { handleWebhook, billGenerateHandler, trackSampleStatusHandler, trackReportStatusHandler } from "../controllers/webhookController.js";

const router = express.Router();

/**
 * POST /api/webhook/crelio
 * 
 * Receives webhook data from Crelio webhook receiver
 * Requires X-Webhook-Token header for authentication
 */
router.post("/crelio", handleWebhook);

/**
 * POST /crelio/webhook
 * 
 * Alternative endpoint matching the original Node.js-Webhook-on-Render format
 * Receives webhook data and saves to database
 * Requires X-Webhook-Token header for authentication
 */
router.post("/crelio/webhook", handleWebhook);
router.post("/crelio/bill-generate", billGenerateHandler);
router.post("/crelio/sample-status", trackSampleStatusHandler);
router.post("/crelio/report-status", trackReportStatusHandler);

export default router;

