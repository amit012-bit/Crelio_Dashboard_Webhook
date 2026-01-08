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
import { sendWebhookAlert } from "../services/emailService.js";
import fs from "fs";
import path from "path";
import RequestDump from "../models/RequestDump.js";

/**
 * Create or find Lab from webhook data
 * 
 * @param {Object} fields - Extracted fields from webhook
 * @param {Object} allFields - All fields from payload
 * @returns {Promise<Object>} - Lab document
 */
const createOrFindLab = async (fields, allFields) => {
  if (!fields.labName && !fields.labId) {
    return null;
  }
  
  // Try to find existing lab by name or ID
  let lab = null;
  if (fields.labId) {
    lab = await Lab.findOne({ labId: String(fields.labId) });
  }
  if (!lab && fields.labName) {
    lab = await Lab.findOne({
      name: { $regex: new RegExp(fields.labName, "i") },
    });
  }
  
  if (!lab) {
    // Create new lab
    const labId = fields.labId ? String(fields.labId) : `LAB-${Date.now()}`;
    
    // Validate email - only set if valid
    const labEmail = (fields.orgEmail && isValidEmail(fields.orgEmail)) ? fields.orgEmail : null;
    
    lab = await Lab.create({
      labId,
      labName: fields.labName || "Unknown Lab",
      address: {
        city: fields.labCity || fields.orgCity || null,
        street: fields.orgAddress || null,
        state: fields.orgArea || null,
      },
      phone: fields.orgContact || null,
      email: labEmail,
      status: "Active",
      webhookMetadata: allFields, // Store all payload data
    });
    console.log(`✅ Created new lab: ${lab.labName}`);
  } else {
    // Update lab with new data
    if (fields.labCity || fields.orgCity) {
      lab.address = lab.address || {};
      lab.address.city = fields.labCity || fields.orgCity || lab.address.city;
    }
    if (fields.orgAddress) {
      lab.address = lab.address || {};
      lab.address.street = fields.orgAddress;
    }
    if (fields.orgContact) lab.phone = fields.orgContact;
    // Only update email if it's valid
    if (fields.orgEmail && isValidEmail(fields.orgEmail)) {
      lab.email = fields.orgEmail;
    }
    lab.webhookMetadata = allFields; // Update with latest payload
    await lab.save();
  }
  
  return lab;
};


/**
 * Helper function to clean field value (handle empty strings, null, etc.)
 * 
 * @param {*} value - Field value from payload
 * @returns {*} - Cleaned value (null if empty/invalid)
 */
const cleanFieldValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Treat empty strings, "-", "N/A", "null" as null
    if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null') {
      return null;
    }
    return trimmed;
  }
  return value;
};

/**
 * Helper function to find field in payload (case-insensitive search)
 * This allows handling different payload structures programmatically
 * 
 * @param {Object} payload - The webhook payload
 * @param {Array<string>} possibleNames - Array of possible field names
 * @returns {*} - The field value or null (cleaned)
 */
const findField = (payload, possibleNames) => {
  // First try exact match (case-sensitive)
  for (const name of possibleNames) {
    if (payload[name] !== undefined) {
      return cleanFieldValue(payload[name]);
    }
  }
  
  // Then try case-insensitive match
  const payloadKeys = Object.keys(payload);
  for (const name of possibleNames) {
    const foundKey = payloadKeys.find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    if (foundKey) {
      return cleanFieldValue(payload[foundKey]);
    }
  }
  
  return null;
};

/**
 * Parse age from string to number
 * Handles formats like "26 years", "26", "26y", etc.
 * 
 * @param {string|number} ageValue - Age value from payload
 * @returns {number|null} - Parsed age as number or null
 */
const parseAge = (ageValue) => {
  if (!ageValue) return null;
  
  // If already a number, return it
  if (typeof ageValue === 'number') {
    return ageValue;
  }
  
  // If string, try to extract number
  if (typeof ageValue === 'string') {
    // Remove all non-digit characters and extract first number
    const match = ageValue.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  
  return null;
};

/**
 * Normalize status value to match Patient model enum
 * Maps various status values from webhook to valid enum values
 * 
 * @param {string} statusValue - Status value from payload
 * @returns {string} - Valid enum status value
 */
const normalizePatientStatus = (statusValue) => {
  // Valid Patient statuses: Registered, Lab Test Scheduled, Sample Collected, 
  // Under Review, Report Generated, Report Delivered, Completed, On Hold, Cancelled
  if (!statusValue || typeof statusValue !== 'string') {
    return "Report Generated"; // Default status for webhook
  }
  
  const statusLower = statusValue.toLowerCase();
  
  // Map various status formats to valid enum values
  const statusMap = {
    // Report Generated variations
    "report pdf (webhook)": "Report Generated",
    "report pdf": "Report Generated",
    "report generated": "Report Generated",
    "pdf generated": "Report Generated",
    "webhook": "Report Generated",
    
    // Registered variations
    "registered": "Registered",
    "registration": "Registered",
    "new": "Registered",
    
    // Lab Test Scheduled variations
    "lab test scheduled": "Lab Test Scheduled",
    "test scheduled": "Lab Test Scheduled",
    "scheduled": "Lab Test Scheduled",
    
    // Sample Collected variations
    "sample collected": "Sample Collected",
    "collected": "Sample Collected",
    "sample taken": "Sample Collected",
    
    // Under Review variations
    "under review": "Under Review",
    "reviewing": "Under Review",
    "in review": "Under Review",
    "review": "Under Review",
    
    // Report Delivered variations
    "report delivered": "Report Delivered",
    "delivered": "Report Delivered",
    "sent": "Report Delivered",
    
    // Completed variations
    "completed": "Completed",
    "done": "Completed",
    "finished": "Completed",
    
    // On Hold variations
    "on hold": "On Hold",
    "hold": "On Hold",
    "paused": "On Hold",
    
    // Cancelled variations
    "cancelled": "Cancelled",
    "canceled": "Cancelled",
    "cancelled": "Cancelled",
  };
  
  // Check if status matches any mapped value
  if (statusMap[statusLower]) {
    return statusMap[statusLower];
  }
  
  // If status contains keywords, map accordingly
  if (statusLower.includes("report") || statusLower.includes("pdf") || statusLower.includes("webhook")) {
    return "Report Generated";
  }
  if (statusLower.includes("delivered") || statusLower.includes("sent")) {
    return "Report Delivered";
  }
  if (statusLower.includes("completed") || statusLower.includes("done")) {
    return "Completed";
  }
  if (statusLower.includes("hold") || statusLower.includes("pause")) {
    return "On Hold";
  }
  if (statusLower.includes("cancel")) {
    return "Cancelled";
  }
  
  // Default to "Report Generated" for webhook data
  return "Report Generated";
};

/**
 * Normalize status value to match Report model enum
 * Maps various status values from webhook to valid enum values
 * 
 * @param {string} statusValue - Status value from payload
 * @returns {string} - Valid enum status value
 */
const normalizeReportStatus = (statusValue) => {
  if (!statusValue || typeof statusValue !== 'string') {
    return "Report Generated"; // Default status for webhook
  }
  
  const statusLower = statusValue.toLowerCase();
  
  // Valid Report statuses: Pending, Sample Collected, Under Analysis, 
  // Report Generated, Reviewed, Delivered, Archived
  
  // Map various status formats to valid enum values
  const statusMap = {
    // Report Generated variations
    "report pdf (webhook)": "Report Generated",
    "report pdf": "Report Generated",
    "report generated": "Report Generated",
    "pdf generated": "Report Generated",
    "webhook": "Report Generated",
    
    // Pending variations
    "pending": "Pending",
    "waiting": "Pending",
    
    // Sample Collected variations
    "sample collected": "Sample Collected",
    "collected": "Sample Collected",
    "sample taken": "Sample Collected",
    
    // Under Analysis variations
    "under analysis": "Under Analysis",
    "analyzing": "Under Analysis",
    "in analysis": "Under Analysis",
    "analysis": "Under Analysis",
    "under review": "Under Analysis",
    
    // Reviewed variations
    "reviewed": "Reviewed",
    "review": "Reviewed",
    "approved": "Reviewed",
    
    // Delivered variations
    "delivered": "Delivered",
    "sent": "Delivered",
    "report delivered": "Delivered",
    
    // Archived variations
    "archived": "Archived",
    "archive": "Archived",
  };
  
  // Check if status matches any mapped value
  if (statusMap[statusLower]) {
    return statusMap[statusLower];
  }
  
  // If status contains keywords, map accordingly
  if (statusLower.includes("report") || statusLower.includes("pdf") || statusLower.includes("webhook")) {
    return "Report Generated";
  }
  if (statusLower.includes("delivered") || statusLower.includes("sent")) {
    return "Delivered";
  }
  if (statusLower.includes("reviewed") || statusLower.includes("approved")) {
    return "Reviewed";
  }
  if (statusLower.includes("analysis") || statusLower.includes("analyzing")) {
    return "Under Analysis";
  }
  if (statusLower.includes("archived")) {
    return "Archived";
  }
  
  // Default to "Report Generated" for webhook data
  return "Report Generated";
};

/**
 * Extract fields from webhook payload programmatically
 * This function extracts both known fields (for schema mapping) and all other fields (for webhookMetadata)
 * 
 * @param {Object} payload - The webhook payload
 * @returns {Object} - Extracted fields with knownFields and allFields
 */
const extractPayloadFields = (payload) => {
  const extracted = {
    knownFields: {},
    allFields: { ...payload }, // Store ALL fields from payload
  };
  
  // Try to find report ID with multiple possible field names
  extracted.knownFields.reportId = findField(payload, [
    "CentreReportId", "centreReportId", "reportId", "ReportId", "Report Id",
    "report_id", "REPORT_ID", "id", "ID"
  ]);
  
  // Try to find Base64 PDF with multiple possible field names
  extracted.knownFields.reportBase64 = findField(payload, [
    "reportBase64", "ReportBase64", "report_base64", "REPORT_BASE64",
    "pdfBase64", "PdfBase64", "pdf_base64", "PDF_BASE64",
    "base64", "Base64", "BASE64", "data", "Data"
  ]);
  
  // Try to find bill ID
  extracted.knownFields.billId = findField(payload, [
    "billId", "BillId", "bill_id", "BILL_ID", "billNumber", "BillNumber"
  ]);
  
  // Try to find test ID
  extracted.knownFields.testId = findField(payload, [
    "testID", "testId", "TestId", "test_id", "TEST_ID", "testID",
    "testNumber", "TestNumber"
  ]);
  
  // Try to find patient information (including fields with spaces)
  extracted.knownFields.patientName = findField(payload, [
    "patientName", "PatientName", "patient_name", "name", "Name", "Patient Name",
    "patientFullName", "fullName"
  ]);
  
  extracted.knownFields.patientAge = findField(payload, [
    "patientAge", "PatientAge", "age", "Age"
  ]);
  
  extracted.knownFields.patientGender = findField(payload, [
    "patientGender", "PatientGender", "gender", "Gender",
    "patient_gender", "sex"
  ]);
  
  extracted.knownFields.patientPhone = findField(payload, [
    "patientPhone", "PatientPhone", "phone", "Phone", "Patient Contact",
    "patient_phone", "contactNumber", "mobile", "Contact No"
  ]);
  
  extracted.knownFields.patientAlternateContact = findField(payload, [
    "patientAlternateContact", "Patient Alternate Contact", "alternateContact",
    "alternatePhone", "Patient Alternate Contact"
  ]);
  
  extracted.knownFields.patientEmail = findField(payload, [
    "patientEmail", "PatientEmail", "email", "Email",
    "patient_email", "emailAddress", "alternateEmail"
  ]);
  
  extracted.knownFields.patientId = findField(payload, [
    "patientId", "PatientId", "patient_id", "Patient Id", "labPatientId"
  ]);
  
  extracted.knownFields.patientDesignation = findField(payload, [
    "patientDesignation", "Patient Designation", "designation"
  ]);
  
  extracted.knownFields.countryCodeOfPatient = findField(payload, [
    "countryCodeOfPatient", "country_code_of_patient", "patientCountryCode"
  ]);
  
  // Try to find doctor/referral information
  extracted.knownFields.doctorName = findField(payload, [
    "doctorName", "DoctorName", "doctor_name", "physicianName",
    "referredBy", "referredDoctor", "Billed Username", "Submitted Username"
  ]);
  
  extracted.knownFields.doctorSpecialty = findField(payload, [
    "doctorSpecialty", "DoctorSpecialty", "specialty", "Specialty",
    "specialization", "department", "Referral Type"
  ]);
  
  extracted.knownFields.referralContact = findField(payload, [
    "referralContact", "Referral Contact", "referral_contact"
  ]);
  
  extracted.knownFields.referralEmail = findField(payload, [
    "referralEmail", "Referral Email", "referral_email"
  ]);
  
  extracted.knownFields.referralAddress = findField(payload, [
    "referralAddress", "Referral Address", "referral_address"
  ]);
  
  extracted.knownFields.referralCity = findField(payload, [
    "referralCity", "Referral City", "referral_city"
  ]);
  
  extracted.knownFields.referralPincode = findField(payload, [
    "referralPincode", "Referral pincode", "referral_pincode", "Referral Pincode"
  ]);
  
  // Try to find test information
  extracted.knownFields.testName = findField(payload, [
    "testName", "TestName", "test_name", "Test Name", "testType", "test_type"
  ]);
  
  extracted.knownFields.testCategory = findField(payload, [
    "testCategory", "TestCategory", "category", "Category",
    "test_category", "labCategory"
  ]);
  
  extracted.knownFields.testCode = findField(payload, [
    "testCode", "test_code", "testCode"
  ]);
  
  // Lab information
  extracted.knownFields.labName = findField(payload, [
    "labName", "lab_name", "labName"
  ]);
  
  extracted.knownFields.labId = findField(payload, [
    "labId", "lab_id", "labId"
  ]);
  
  extracted.knownFields.labCity = findField(payload, [
    "labCity", "lab_city", "labCity"
  ]);
  
  // Organization information
  extracted.knownFields.orgName = findField(payload, [
    "orgName", "Org Name", "organizationName"
  ]);
  
  extracted.knownFields.orgCode = findField(payload, [
    "orgCode", "Org Code", "org_code"
  ]);
  
  extracted.knownFields.orgAddress = findField(payload, [
    "orgAddress", "Org Address", "org_address"
  ]);
  
  extracted.knownFields.orgCity = findField(payload, [
    "orgCity", "Org City", "org_city"
  ]);
  
  extracted.knownFields.orgArea = findField(payload, [
    "orgArea", "Org Area", "org_area"
  ]);
  
  extracted.knownFields.orgContact = findField(payload, [
    "orgContact", "Org Contact", "org_contact"
  ]);
  
  extracted.knownFields.orgEmail = findField(payload, [
    "orgEmail", "Org email", "org_email"
  ]);
  
  // Dates
  extracted.knownFields.sampleDate = findField(payload, [
    "sampleDate", "Sample Date", "sample_date"
  ]);
  
  extracted.knownFields.reportDate = findField(payload, [
    "reportDate", "Report Date", "report_date", "reportDate"
  ]);
  
  extracted.knownFields.accessionDate = findField(payload, [
    "accessionDate", "Accession Date", "accession_date"
  ]);
  
  extracted.knownFields.approvalDate = findField(payload, [
    "approvalDate", "Approval Date", "approval_date"
  ]);
  
  // Status and payment
  extracted.knownFields.status = findField(payload, [
    "status", "Status"
  ]);
  
  extracted.knownFields.billPaymentStatus = findField(payload, [
    "billPaymentStatus", "bill_payment_status", "billPaymentStatus"
  ]);
  
  extracted.knownFields.billPaymentMode = findField(payload, [
    "billPaymentMode", "bill_payment_mode", "billPaymentMode"
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
const createOrUpdatePatient = async (fields, allFields, fullPayload) => {
  // Log raw fields for debugging
  console.log("🔍 Raw extracted fields in createOrUpdatePatient:", {
    patientId: fields.patientId,
    patientName: fields.patientName,
    patientAge: fields.patientAge,
    patientGender: fields.patientGender,
    patientPhone: fields.patientPhone,
    patientEmail: fields.patientEmail,
  });
  
  // Generate patient ID from reportId, patientId, or create new one
  const patientId = fields.patientId 
    ? (typeof fields.patientId === 'string' ? fields.patientId : String(fields.patientId))
    : (fields.reportId ? `PAT-${fields.reportId}` : `PAT-${Date.now()}`);
  
  // Check for duplicate patient based ONLY on patientId (from payload or generated)
  let patient = null;
  const patientIdStr = typeof patientId === 'string' ? patientId : String(patientId);
  patient = await Patient.findOne({ patientId: patientIdStr });
  if (patient) {
    console.log(`🔍 Found existing patient by patientId: ${patientIdStr}`);
  }
  
  // Prepare patient data
  // Parse age to handle formats like "26 years" -> 26
  const parsedAge = parseAge(fields.patientAge);
  
  // Convert billId, testId, reportId to strings if they're numbers
  const stringifyId = (id) => id ? String(id) : null;
  
  // Check if patient name is missing and log warning
  if (!fields.patientName || fields.patientName === "Unknown Patient") {
    console.warn("⚠️  Patient name is missing or empty. Available fields:", Object.keys(allFields));
    console.warn("⚠️  Looking for 'Patient Name' in payload:", allFields["Patient Name"]);
  }
  
  const patientData = {
    patientId,
    name: fields.patientName || "Unknown Patient",
    age: parsedAge,
    gender: fields.patientGender || "Not Specified",
    // Use alternate contact if primary contact is empty
    phone: fields.patientPhone || fields.patientAlternateContact || null,
    // Validate email - only set if valid, otherwise null
    email: (fields.patientEmail && isValidEmail(fields.patientEmail)) ? fields.patientEmail : null,
    billId: stringifyId(fields.billId),
    testId: stringifyId(fields.testId),
    reportId: stringifyId(fields.reportId),
    status: normalizePatientStatus(fields.status), // Normalize status to valid enum value
    currentStage: "Report Generated",
    // Store ALL payload fields in webhookMetadata (this captures everything, even unknown fields)
    webhookMetadata: allFields, // Store complete payload with all fields
    lastVisitDate: new Date(),
    registrationDate: new Date(), // Set registration date for dashboard filtering
  };
  
  // Add address if available from org/referral fields
  if (fields.orgCity || fields.referralCity) {
    patientData.address = {
      city: fields.orgCity || fields.referralCity || null,
      state: fields.orgArea || null,
      zipCode: fields.referralPincode || null,
      country: fields.countryCodeOfPatient || null,
    };
  }
  
  if (patient) {
    // Update existing patient (preserve registrationDate if it exists)
    if (patient.registrationDate) {
      patientData.registrationDate = patient.registrationDate;
    }
    Object.assign(patient, patientData);
    await patient.save();
    console.log(`✅ Updated patient: ${patient.patientId} - Name: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}`);
  } else {
    // Create new patient
    patient = await Patient.create(patientData);
    console.log(`✅ Created new patient: ${patient.patientId} - Name: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}`);
  }
  
  return patient;
};

/**
 * Normalize specialty value to match Doctor model enum
 * Maps various specialty values from webhook to valid enum values
 * 
 * @param {string} specialtyValue - Specialty value from payload
 * @returns {string} - Valid enum specialty value
 */
const normalizeSpecialty = (specialtyValue) => {
  if (!specialtyValue || typeof specialtyValue !== 'string') {
    return "General Practitioner"; // Default specialty
  }
  
  const specialtyLower = specialtyValue.toLowerCase();
  
  // Valid Doctor specialties: General Practitioner, Cardiologist, Dermatologist, 
  // Dentist, Oculist, Surgeon, Physician, Gynecologist, Neurologist, Oncologist, 
  // Orthopedist, Physiotherapist, Anesthesiologist, Other
  
  // Map various specialty formats to valid enum values
  const specialtyMap = {
    // General Practitioner variations
    "none (default)": "General Practitioner",
    "none": "General Practitioner",
    "default": "General Practitioner",
    "general practitioner": "General Practitioner",
    "general": "General Practitioner",
    "gp": "General Practitioner",
    "family doctor": "General Practitioner",
    
    // Cardiologist variations
    "cardiologist": "Cardiologist",
    "cardiology": "Cardiologist",
    "heart specialist": "Cardiologist",
    
    // Dermatologist variations
    "dermatologist": "Dermatologist",
    "dermatology": "Dermatologist",
    "skin specialist": "Dermatologist",
    
    // Dentist variations
    "dentist": "Dentist",
    "dental": "Dentist",
    "oral surgeon": "Dentist",
    
    // Oculist variations
    "oculist": "Oculist",
    "ophthalmologist": "Oculist",
    "eye specialist": "Oculist",
    "eye doctor": "Oculist",
    
    // Surgeon variations
    "surgeon": "Surgeon",
    "surgery": "Surgeon",
    "general surgeon": "Surgeon",
    
    // Physician variations
    "physician": "Physician",
    "internal medicine": "Physician",
    
    // Gynecologist variations
    "gynecologist": "Gynecologist",
    "gynecology": "Gynecologist",
    "obgyn": "Gynecologist",
    
    // Neurologist variations
    "neurologist": "Neurologist",
    "neurology": "Neurologist",
    
    // Oncologist variations
    "oncologist": "Oncologist",
    "oncology": "Oncologist",
    "cancer specialist": "Oncologist",
    
    // Orthopedist variations
    "orthopedist": "Orthopedist",
    "orthopedic": "Orthopedist",
    "orthopedic surgeon": "Orthopedist",
    
    // Physiotherapist variations
    "physiotherapist": "Physiotherapist",
    "physical therapist": "Physiotherapist",
    "physiotherapy": "Physiotherapist",
    
    // Anesthesiologist variations
    "anesthesiologist": "Anesthesiologist",
    "anesthesia": "Anesthesiologist",
    
    // Other
    "other": "Other",
  };
  
  // Check if specialty matches any mapped value
  if (specialtyMap[specialtyLower]) {
    return specialtyMap[specialtyLower];
  }
  
  // If specialty contains keywords, map accordingly
  if (specialtyLower.includes("cardio") || specialtyLower.includes("heart")) {
    return "Cardiologist";
  }
  if (specialtyLower.includes("derma") || specialtyLower.includes("skin")) {
    return "Dermatologist";
  }
  if (specialtyLower.includes("dental") || specialtyLower.includes("tooth")) {
    return "Dentist";
  }
  if (specialtyLower.includes("eye") || specialtyLower.includes("ophthal")) {
    return "Oculist";
  }
  if (specialtyLower.includes("surg")) {
    return "Surgeon";
  }
  if (specialtyLower.includes("gyne") || specialtyLower.includes("obg")) {
    return "Gynecologist";
  }
  if (specialtyLower.includes("neuro")) {
    return "Neurologist";
  }
  if (specialtyLower.includes("onco") || specialtyLower.includes("cancer")) {
    return "Oncologist";
  }
  if (specialtyLower.includes("ortho")) {
    return "Orthopedist";
  }
  if (specialtyLower.includes("physio") || specialtyLower.includes("physical therapy")) {
    return "Physiotherapist";
  }
  if (specialtyLower.includes("anesth")) {
    return "Anesthesiologist";
  }
  
  // Default to "General Practitioner"
  return "General Practitioner";
};

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Generate a default email for doctor if not provided
 * 
 * @param {string} doctorName - Doctor name
 * @returns {string} - Generated email
 */
const generateDoctorEmail = (doctorName) => {
  if (!doctorName) return `doctor-${Date.now()}@crelio.local`;
  
  // Create email from name (lowercase, replace spaces with dots)
  const emailName = doctorName
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .substring(0, 50); // Limit length
  
  return `${emailName}@crelio.local`;
};

/**
 * Generate a default phone for doctor if not provided
 * 
 * @returns {string} - Generated phone
 */
const generateDoctorPhone = () => {
  return `+91-0000000000`; // Default phone format
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
    // Create new doctor with required fields
    const doctorId = `DOC-${Date.now()}`;
    const normalizedSpecialty = normalizeSpecialty(fields.doctorSpecialty);
    
    // Validate and use referral email, or generate one
    let doctorEmail = fields.referralEmail;
    if (!isValidEmail(doctorEmail)) {
      doctorEmail = generateDoctorEmail(fields.doctorName);
    }
    
    // Use referral contact or generate default
    const doctorPhone = fields.referralContact || generateDoctorPhone();
    
    doctor = await Doctor.create({
      doctorId,
      name: fields.doctorName,
      email: doctorEmail,
      phone: doctorPhone,
      specialty: normalizedSpecialty,
      status: "Active",
    });
    console.log(`✅ Created new doctor: ${doctor.name}`);
  } else {
    // Update existing doctor if new data is available
    if (fields.doctorSpecialty) {
      doctor.specialty = normalizeSpecialty(fields.doctorSpecialty);
    }
    // Only update email if it's a valid email and not a generated one
    if (fields.referralEmail && isValidEmail(fields.referralEmail) && !doctor.email.includes('@crelio.local')) {
      doctor.email = fields.referralEmail;
    }
    // Only update phone if we have a valid contact and current phone is default
    if (fields.referralContact && doctor.phone === generateDoctorPhone()) {
      doctor.phone = fields.referralContact;
    }
    await doctor.save();
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
const createReport = async (fields, allFields, patient, doctor, fullPayload) => {
  if (!fields.reportId) {
    throw new Error("Report ID is required");
  }
  
  // Convert reportId to string
  const reportIdStr = String(fields.reportId);
  
  // Check if report already exists (handle both string and number)
  let report = await Report.findOne({ 
    $or: [
      { reportId: reportIdStr },
      { reportId: fields.reportId } // Also try as number
    ]
  });
  
  // Helper to convert IDs to strings
  const stringifyId = (id) => id ? String(id) : null;
  
  // Parse dates from string format
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  
  if (report) {
    // Update existing report
    report.reportBase64 = fields.reportBase64 || report.reportBase64;
    report.billId = stringifyId(fields.billId) || report.billId;
    report.testId = stringifyId(fields.testId) || report.testId;
    report.testName = fields.testName || report.testName;
    report.testCategory = fields.testCategory || report.testCategory;
    report.testCode = fields.testCode || report.testCode;
    report.webhookMetadata = allFields; // Store ALL fields
    report.status = normalizeReportStatus(fields.status); // Normalize status to valid enum value
    report.reportGeneratedDate = parseDate(fields.reportDate) || new Date();
    report.testDate = parseDate(fields.sampleDate) || report.testDate;
    if (doctor) report.doctor = doctor._id;
    
    // Save PDF file and metadata to disk if base64 data is provided and not already saved
    if (fields.reportBase64 && !report.pdfPath) {
      try {
        const folder = "./reports";
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
        
        const buffer = Buffer.from(fields.reportBase64, "base64");
        const filePath = path.join(folder, `report_${reportIdStr}.pdf`);
        fs.writeFileSync(filePath, buffer);
        report.pdfPath = filePath;
        report.fileSize = buffer.length;
        report.fileName = `report_${reportIdStr}.pdf`;
        
        console.log(`📄 PDF Saved: ${filePath}`);
        
        // Create metadata file with all payload information
        const metadata = {
          timestamp: new Date().toISOString(),
          reportId: fields.reportId,
          billId: fields.billId,
          testId: fields.testId,
          patientName: fields.patientName,
          patientId: fields.patientId,
          allPayloadFields: Object.keys(allFields), // Log all fields received
          payloadStructure: Object.keys(allFields).reduce((acc, key) => {
            // Store field types (but not large base64 data)
            if (key.toLowerCase().includes("base64")) {
              acc[key] = `[Base64 String - ${allFields[key]?.length || 0} chars]`;
            } else {
              acc[key] = typeof allFields[key];
            }
            return acc;
          }, {})
        };
        
        const metadataPath = path.join(folder, `report_${reportIdStr}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`📝 Metadata Saved: ${metadataPath}`);
      } catch (fileError) {
        console.error("⚠️  Error saving PDF/metadata file:", fileError.message);
        // Don't fail the webhook if file save fails
      }
    }
    
    await report.save();
    console.log(`✅ Updated report: ${report.reportId}`);
  } else {
    // Create new report
    const reportData = {
      reportId: reportIdStr,
      billId: stringifyId(fields.billId),
      testId: stringifyId(fields.testId),
      patient: patient._id,
      doctor: doctor ? doctor._id : null,
      reportBase64: fields.reportBase64 || null,
      testName: fields.testName || "Lab Test",
      testType: fields.testType || null,
      testCategory: fields.testCategory || null,
      testCode: fields.testCode || null,
      status: normalizeReportStatus(fields.status), // Normalize status to valid enum value
      testDate: parseDate(fields.sampleDate) || new Date(),
      reportGeneratedDate: parseDate(fields.reportDate) || new Date(),
      webhookMetadata: allFields, // Store ALL fields from payload
    };
    
    // Calculate file size and save PDF file if base64 data exists
    if (fields.reportBase64) {
      reportData.fileSize = Buffer.from(fields.reportBase64, "base64").length;
      reportData.fileName = `report_${reportIdStr}.pdf`;
      
      // Save PDF file and metadata to disk (like original webhook receiver)
      try {
        const folder = "./reports";
        // Create reports folder if it doesn't exist
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
        
        // Decode the Base64 PDF data into a buffer
        const buffer = Buffer.from(fields.reportBase64, "base64");
        const filePath = path.join(folder, `report_${reportIdStr}.pdf`);
        
        // Save PDF file
        fs.writeFileSync(filePath, buffer);
        reportData.pdfPath = filePath;
        
        console.log(`📄 PDF Saved: ${filePath}`);
        
        // Create metadata file with all payload information (like original webhook receiver)
        const metadata = {
          timestamp: new Date().toISOString(),
          reportId: fields.reportId,
          billId: fields.billId,
          testId: fields.testId,
          patientName: fields.patientName,
          patientId: fields.patientId,
          allPayloadFields: Object.keys(allFields), // Log all fields received
          payloadStructure: Object.keys(allFields).reduce((acc, key) => {
            // Store field types (but not large base64 data)
            if (key.toLowerCase().includes("base64")) {
              acc[key] = `[Base64 String - ${allFields[key]?.length || 0} chars]`;
            } else {
              acc[key] = typeof allFields[key];
            }
            return acc;
          }, {})
        };
        
        const metadataPath = path.join(folder, `report_${reportIdStr}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log(`📝 Metadata Saved: ${metadataPath}`);
      } catch (fileError) {
        console.error("⚠️  Error saving PDF/metadata file:", fileError.message);
        // Don't fail the webhook if file save fails - data is still in DB
      }
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
  
  // Extract fields programmatically (returns knownFields and allFields)
  const extracted = extractPayloadFields(payload);
  const fields = extracted.knownFields;
  const allFields = extracted.allFields;
  
  // Log extracted patient fields for debugging
  console.log("🔍 Extracted Patient Fields:", {
    patientId: fields.patientId,
    patientName: fields.patientName,
    patientAge: fields.patientAge,
    patientGender: fields.patientGender,
    patientPhone: fields.patientPhone,
    patientEmail: fields.patientEmail,
  });
  
  // Validate required fields
  if (!fields.reportId) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: reportId (or CentreReportId)",
      receivedFields: Object.keys(payload),
    });
  }
  
  try {
    // Create or update patient (pass allFields to store everything)
    const patient = await createOrUpdatePatient(fields, allFields, payload);
    console.log("👤 Patient Data:", {
      patientId: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      status: patient.status,
    });
    
    // Create or find doctor
    const doctor = await createOrFindDoctor(fields);
    
    // Create or find lab
    const lab = await createOrFindLab(fields, allFields);
    
    // Assign doctor to patient if found
    if (doctor && !patient.assignedDoctor) {
      patient.assignedDoctor = doctor._id;
      await patient.save();
      
      // Update doctor's patient count
      doctor.patientCount = await Patient.countDocuments({ assignedDoctor: doctor._id });
      await doctor.save();
    }
    
    // Create report (pass allFields to store everything)
    const report = await createReport(fields, allFields, patient, doctor, payload);
    
    // Send email alert (don't await - let it run in background)
    // If email fails, it won't affect the webhook response
    sendWebhookAlert({
      reportId: fields.reportId,
      billId: fields.billId,
      testId: fields.testId,
      patientName: patient.name,
      patient: patient,
      report: report,
      payload: payload,
    }).catch((emailError) => {
      // Log email error but don't throw (webhook processing should succeed even if email fails)
      console.error("⚠️  Email alert failed (webhook still processed):", emailError.message);
    });
    
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

export const billGenerateHandler = async (req, res) => {
  try {
    const token = req.headers["x-webhook-token"];
    const expectedToken = process.env.WEBHOOK_SECRET;
    if (!token || token !== expectedToken) {
      return res.status(401).json({ success: false, message: "Invalid webhook token" });
    }
    await RequestDump.create({ request: req.body });
    return res.status(200).json({ success: true, message: "Bill Generate Webhook Received" });
  } catch (error) {
    console.error("❌ Error generating bill:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
