import Patient from "../models/Patient.js";
import RequestDump from "../models/RequestDump.js";
import ReportStatusTracker from "../models/ReportStatusTracker.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";

export const patientRegisterHandler = async (req, res) => {
  try {
    await Patient.create({ patient: req.body });
    return res.status(200).json({ success: true, message: "Patient Register Webhook Received" });
    
  } catch (error) {
    console.error("❌ Error receiving patient register webhook data:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const billGenerateHandler = async (req, res) => {
  try {
    // const token = req.headers["x-webhook-token"];
    // const expectedToken = process.env.WEBHOOK_SECRET;
    // if (!token || token !== expectedToken) {
    //   return res.status(401).json({ success: false, message: "Invalid webhook token" });
    // }
    await RequestDump.create({ request: req.body });
    return res.status(200).json({ success: true, message: "Bill Generate Webhook Received" });
  } catch (error) {
    console.error("❌ Error generating bill:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const trackReportStatusHandler = async (req, res) => {
  try {
    await ReportStatusTracker.create({ request: req.body });
    return res.status(200).json({ success: true, message: "Report webhook data received" });
  } catch (error) {
    console.error("❌ Error receiving report webhook data:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const trackSampleStatusHandler = async (req, res) => {
  try {
    await SampleStatusTracker.create({ request: req.body });
    return res.status(200).json({ success: true, message: "Sample webhook data received" });
  } catch (error) {
    console.error("❌ Error receiving sample webhook data:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};