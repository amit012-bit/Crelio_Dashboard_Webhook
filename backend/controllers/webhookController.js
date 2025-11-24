/**
 * Webhook Controller
 * 
 * This controller handles incoming webhook requests from the Node.js-Webhook-on-Render service.
 * It processes the webhook payload, extracts patient/report data, and saves it to the database.
 * 
 * Features:
 * - Validates webhook token
 * - Extracts data from flexible payload structure
 * - Creates/updates patients, reports, and related entities
 * - Handles Base64 PDF data
 */

import Patient from "../models/Patient.js";
import Report from "../models/Report.js";
import Doctor from "../models/Doctor.js";
import Lab from "../models/Lab.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Helper function to find field in payload (case-insensitive search)
 * This allows handling different payload structures programmatically
 * 
 * @param {Object} payload - The webhook payload
 * @param {Array<string>} possibleNames - Array of possible field names
 * @returns {*} - The field value or null
 */
const findField = (payload, possibleNames) => {
  // First try exact match (case-sensitive)
  for (const name of possibleNames) {
    if (payload[name] !== undefined) {
      return payload[name];
    }
  }
  
  // Then try case-insensitive match
  const payloadKeys = Object.keys(payload);
  for (const name of possibleNames) {
    const foundKey = payloadKeys.find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    if (foundKey) {
      return payload[foundKey];
    }
  }
  
  return null;
};

/**
 * Extract fields from webhook payload programmatically
 * 
 * @param {Object} payload - The webhook payload
 * @returns {Object} - Extracted fields
 */
const extractPayloadFields = (payload) => {
  const extracted = {};
  
  // Try to find report ID with multiple possible field names
  extracted.reportId = findField(payload, [
    "CentreReportId", "centreReportId", "reportId", "ReportId",
    "report_id", "REPORT_ID", "id", "ID"
  ]);
  
  // Try to find Base64 PDF with multiple possible field names
  extracted.reportBase64 = findField(payload, [
    "reportBase64", "ReportBase64", "report_base64", "REPORT_BASE64",
    "pdfBase64", "PdfBase64", "pdf_base64", "PDF_BASE64",
    "base64", "Base64", "BASE64", "data", "Data"
  ]);
  
  // Try to find bill ID
  extracted.billId = findField(payload, [
    "billId", "BillId", "bill_id", "BILL_ID", "billNumber", "BillNumber"
  ]);
  
  // Try to find test ID
  extracted.testId = findField(payload, [
    "testID", "testId", "TestId", "test_id", "TEST_ID",
    "testNumber", "TestNumber"
  ]);
  
  // Try to find patient information
  extracted.patientName = findField(payload, [
    "patientName", "PatientName", "patient_name", "name", "Name",
    "patientFullName", "fullName"
  ]);
  
  extracted.patientAge = findField(payload, [
    "patientAge", "PatientAge", "age", "Age"
  ]);
  
  extracted.patientGender = findField(payload, [
    "patientGender", "PatientGender", "gender", "Gender",
    "patient_gender", "sex"
  ]);
  
  extracted.patientPhone = findField(payload, [
    "patientPhone", "PatientPhone", "phone", "Phone",
    "patient_phone", "contactNumber", "mobile"
  ]);
  
  extracted.patientEmail = findField(payload, [
    "patientEmail", "PatientEmail", "email", "Email",
    "patient_email", "emailAddress"
  ]);
  
  // Try to find doctor information
  extracted.doctorName = findField(payload, [
    "doctorName", "DoctorName", "doctor_name", "physicianName",
    "referredBy", "referredDoctor"
  ]);
  
  extracted.doctorSpecialty = findField(payload, [
    "doctorSpecialty", "DoctorSpecialty", "specialty", "Specialty",
    "specialization", "department"
  ]);
  
  // Try to find test information
  extracted.testName = findField(payload, [
    "testName", "TestName", "test_name", "testType", "test_type"
  ]);
  
  extracted.testCategory = findField(payload, [
    "testCategory", "TestCategory", "category", "Category",
    "test_category", "labCategory"
  ]);
  
  return extracted;
};

/**
 * Create or update patient from webhook data
 * 
 * @param {Object} fields - Extracted fields from webhook
 * @param {Object} fullPayload - Full webhook payload
 * @returns {Promise<Object>} - Patient document
 */
const createOrUpdatePatient = async (fields, fullPayload) => {
  // Generate patient ID from reportId or create new one
  const patientId = fields.reportId 
    ? `PAT-${fields.reportId}` 
    : `PAT-${Date.now()}`;
  
  // Prepare patient data
  const patientData = {
    patientId,
    name: fields.patientName || "Unknown Patient",
    age: fields.patientAge || null,
    gender: fields.patientGender || "Not Specified",
    phone: fields.patientPhone || null,
    email: fields.patientEmail || null,
    billId: fields.billId || null,
    testId: fields.testId || null,
    reportId: fields.reportId || null,
    status: "Report Generated", // Default status when report is received
    currentStage: "Report Generated",
    webhookMetadata: fullPayload,
    lastVisitDate: new Date(),
  };
  
  // Try to find existing patient by reportId or billId
  let patient = null;
  if (fields.reportId) {
    patient = await Patient.findOne({ reportId: fields.reportId });
  }
  if (!patient && fields.billId) {
    patient = await Patient.findOne({ billId: fields.billId });
  }
  
  if (patient) {
    // Update existing patient
    Object.assign(patient, patientData);
    await patient.save();
    console.log(`✅ Updated patient: ${patient.patientId}`);
  } else {
    // Create new patient
    patient = await Patient.create(patientData);
    console.log(`✅ Created new patient: ${patient.patientId}`);
  }
  
  return patient;
};

/**
 * Create or find doctor from webhook data
 * 
 * @param {Object} fields - Extracted fields from webhook
 * @returns {Promise<Object>} - Doctor document
 */
const createOrFindDoctor = async (fields) => {
  if (!fields.doctorName) {
    return null;
  }
  
  // Try to find existing doctor by name
  let doctor = await Doctor.findOne({
    name: { $regex: new RegExp(fields.doctorName, "i") },
  });
  
  if (!doctor) {
    // Create new doctor
    const doctorId = `DOC-${Date.now()}`;
    doctor = await Doctor.create({
      doctorId,
      name: fields.doctorName,
      specialty: fields.doctorSpecialty || "General Practitioner",
      status: "Active",
    });
    console.log(`✅ Created new doctor: ${doctor.name}`);
  }
  
  return doctor;
};

/**
 * Create report from webhook data
 * 
 * @param {Object} fields - Extracted fields from webhook
 * @param {Object} patient - Patient document
 * @param {Object} doctor - Doctor document (optional)
 * @param {Object} fullPayload - Full webhook payload
 * @returns {Promise<Object>} - Report document
 */
const createReport = async (fields, patient, doctor, fullPayload) => {
  if (!fields.reportId) {
    throw new Error("Report ID is required");
  }
  
  // Check if report already exists
  let report = await Report.findOne({ reportId: fields.reportId });
  
  if (report) {
    // Update existing report
    report.reportBase64 = fields.reportBase64 || report.reportBase64;
    report.billId = fields.billId || report.billId;
    report.testId = fields.testId || report.testId;
    report.testName = fields.testName || report.testName;
    report.testCategory = fields.testCategory || report.testCategory;
    report.webhookMetadata = fullPayload;
    report.status = "Report Generated";
    report.reportGeneratedDate = new Date();
    if (doctor) report.doctor = doctor._id;
    
    await report.save();
    console.log(`✅ Updated report: ${report.reportId}`);
  } else {
    // Create new report
    const reportData = {
      reportId: fields.reportId,
      billId: fields.billId || null,
      testId: fields.testId || null,
      patient: patient._id,
      doctor: doctor ? doctor._id : null,
      reportBase64: fields.reportBase64 || null,
      testName: fields.testName || "Lab Test",
      testType: fields.testType || null,
      testCategory: fields.testCategory || null,
      status: "Report Generated",
      testDate: new Date(),
      reportGeneratedDate: new Date(),
      webhookMetadata: fullPayload,
    };
    
    // Calculate file size if base64 data exists
    if (fields.reportBase64) {
      reportData.fileSize = Buffer.from(fields.reportBase64, "base64").length;
      reportData.fileName = `report_${fields.reportId}.pdf`;
    }
    
    report = await Report.create(reportData);
    console.log(`✅ Created new report: ${report.reportId}`);
    
    // Add report to patient's labReports array
    patient.labReports.push(report._id);
    await patient.save();
  }
  
  return report;
};

/**
 * Handle incoming webhook
 * 
 * POST /api/webhook/crelio
 * 
 * @route POST /api/webhook/crelio
 * @access Private (requires webhook token)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  // Validate webhook token
  const token = req.headers["x-webhook-token"];
  const expectedToken = process.env.WEBHOOK_SECRET;
  
  if (!token || token !== expectedToken) {
    return res.status(401).json({
      success: false,
      error: "Invalid webhook token",
    });
  }
  
  // Extract payload
  const payload = req.body;
  
  // Log received payload structure
  console.log("📦 Received Webhook Payload Structure:", Object.keys(payload));
  
  // Extract fields programmatically
  const fields = extractPayloadFields(payload);
  
  // Validate required fields
  if (!fields.reportId) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: reportId (or CentreReportId)",
      receivedFields: Object.keys(payload),
    });
  }
  
  try {
    // Create or update patient
    const patient = await createOrUpdatePatient(fields, payload);
    
    // Create or find doctor
    const doctor = await createOrFindDoctor(fields);
    
    // Assign doctor to patient if found
    if (doctor && !patient.assignedDoctor) {
      patient.assignedDoctor = doctor._id;
      await patient.save();
      
      // Update doctor's patient count
      doctor.patientCount = await Patient.countDocuments({ assignedDoctor: doctor._id });
      await doctor.save();
    }
    
    // Create report
    const report = await createReport(fields, patient, doctor, payload);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        patient: {
          id: patient._id,
          patientId: patient.patientId,
          name: patient.name,
          status: patient.status,
        },
        report: {
          id: report._id,
          reportId: report.reportId,
          status: report.status,
        },
        doctor: doctor ? {
          id: doctor._id,
          name: doctor.name,
          specialty: doctor.specialty,
        } : null,
      },
    });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    throw error; // Will be caught by errorHandler middleware
  }
});

