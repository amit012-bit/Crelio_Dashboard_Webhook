import Patient from "../models/Patient.js";
import RequestDump from "../models/RequestDump.js";
import ReportStatusTracker from "../models/ReportStatusTracker.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";
import Report from "../models/Report.js";
import { consolidatePatientFromWebhook } from "../services/patientConsolidationService.js";

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
    
    // Trigger patient consolidation automatically (runs in background)
    consolidatePatientFromWebhook('billGenerate', req.body);
    
    return res.status(200).json({ success: true, message: "Bill Generate Webhook Received" });
  } catch (error) {
    console.error("❌ Error generating bill:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const trackReportStatusHandler = async (req, res) => {
  try {
    await ReportStatusTracker.create({ request: req.body });
    const {labReportId, billId, testID: testId, status, "Signing Doctor": signingDoctor, "Sample Date": sampleDate, reportBase64} = req.body;

    // Build dynamic update object
    const update = {
      status,
    };

    // Status-based fields
    if (status === "Report Signed" && signingDoctor) {
      update.signingDoctor = signingDoctor;
      update.sampleDate = sampleDate;
    }

    if (status === "Report PDF (Webhook)" && reportBase64) {
      update.reportBase64 = reportBase64;
    }

    await Report.findOneAndUpdate(
      { billId, testId },           // unique key
      {
        $set: update,               // update status + conditional fields
        $setOnInsert: {             // only on first create
          labReportId,
          billId,
          testId,
        },
      },
      {
        upsert: true,               // create if not exists
        new: true,
      }
    );

    // Trigger patient consolidation automatically (runs in background)
    consolidatePatientFromWebhook('reportStatus', req.body);

    return res.status(200).json({ success: true, message: "Report webhook data received" });
  } catch (error) {
    console.error("❌ Error receiving report webhook data:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const trackSampleStatusHandler = async (req, res) => {
  try {
    await SampleStatusTracker.create({ request: req.body });
    
    // Trigger patient consolidation automatically (runs in background)
    consolidatePatientFromWebhook('sampleStatus', req.body);
    
    return res.status(200).json({ success: true, message: "Sample webhook data received" });
  } catch (error) {
    console.error("❌ Error receiving sample webhook data:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};