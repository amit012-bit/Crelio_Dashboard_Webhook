/**
 * Patient Data Consolidation Script
 * 
 * This script consolidates all patient-related data from multiple tables:
 * - RequestDump (Bill Generate webhooks)
 * - ReportStatusTracker (Report Status webhooks)
 * - SampleStatusTracker (Sample Status webhooks)
 * - Existing Patient records
 * 
 * It extracts patient information from all sources and creates/updates
 * Patient records with complete consolidated data.
 * 
 * Usage: node scripts/consolidatePatientData.js
 */

import dotenv from "dotenv";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import RequestDump from "../models/RequestDump.js";
import ReportStatusTracker from "../models/ReportStatusTracker.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";
import Report from "../models/Report.js";
import { connectDB, disconnectDB } from "../config/database.js";

/**
 * Extract patient data from Report entry
 */
function extractFromReport(reportData) {
  if (!reportData || typeof reportData !== 'object') return null;
  
  const data = {
    // Billing Information (to link with patient)
    billId: reportData.billId ? String(reportData.billId) : null,
    billIdNumber: reportData.billId || null,
    
    // Test Information
    testId: reportData.testId ? String(reportData.testId) : null,
    testIdNumber: reportData.testId || null,
    labReportId: reportData.labReportId || null,
    
    // Report Status and Doctor Information
    reportStatus: reportData.status || null,
    signingDoctor: reportData.signingDoctor || null,
    reportBase64: reportData.reportBase64 || null,
    sampleDate: reportData.sampleDate instanceof Date ? reportData.sampleDate : 
                (reportData.sampleDate ? new Date(reportData.sampleDate) : null),
    
    // Metadata
    webhookMetadata: reportData,
  };
  
  return data;
}

// Load environment variables
dotenv.config();

/**
 * Extract doctor name from billReferral string
 */
function extractDoctorNameFromReferral(billReferral) {
  if (!billReferral || typeof billReferral !== 'string') return null;
  
  // billReferral format: "Dr. Name" or "Dr. Name ; Clinic Name" or "SELF"
  if (billReferral === 'SELF' || billReferral.trim() === '') return null;
  
  // Extract doctor name (before semicolon if present)
  const doctorName = billReferral.split(';')[0].trim();
  if (doctorName && doctorName !== 'SELF') {
    return doctorName;
  }
  return null;
}

/**
 * Extract doctor name from signingDoctor array
 */
function extractDoctorNameFromSigningDoctor(signingDoctor) {
  if (!signingDoctor || !Array.isArray(signingDoctor) || signingDoctor.length === 0) return null;
  
  // signingDoctor format: [{"Signing Doctor 1": "Dr. Name"}]
  const firstDoctor = signingDoctor[0];
  if (firstDoctor && typeof firstDoctor === 'object') {
    const doctorName = Object.values(firstDoctor)[0];
    if (doctorName && typeof doctorName === 'string') {
      return doctorName.trim();
    }
  }
  return null;
}

/**
 * Find or create Doctor by name
 */
async function findOrCreateDoctor(doctorName, docId = null) {
  if (!doctorName || typeof doctorName !== 'string') return null;
  
  try {
    // Try to find existing doctor by name (case-insensitive)
    let doctor = await Doctor.findOne({
      name: { $regex: new RegExp(`^${doctorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (!doctor) {
      // Create new doctor if not found
      const doctorId = docId ? `DOC-${docId}` : `DOC-${Date.now()}`;
      doctor = await Doctor.create({
        doctorId: doctorId,
        name: doctorName,
        email: `${doctorId.toLowerCase().replace(/-/g, '')}@crelio.local`,
        phone: '0000000000', // Default phone since it's required
        specialty: 'General Practitioner',
        status: 'Active',
      });
      console.log(`   👨‍⚕️  Created new doctor: ${doctorName} (${doctorId})`);
    }
    
    return doctor._id;
  } catch (error) {
    console.error(`   ⚠️  Error finding/creating doctor ${doctorName}:`, error.message);
    return null;
  }
}

/**
 * Extract patient data from RequestDump entry
 */
function extractFromRequestDump(requestData) {
  if (!requestData || typeof requestData !== 'object') return null;
  
  const data = {
    // Basic Information
    name: requestData["Patient Name"] || requestData.patientName || null,
    designation: requestData["Patient Designation"] || null,
    age: requestData["Patient Age"] ? parseInt(requestData["Patient Age"]) : null,
    gender: requestData["Patient gender"] || requestData.gender || null,
    dateOfBirthString: requestData["Patient Dob"] || null,
    
    // Contact Information
    email: requestData.patient_email || requestData.email || null,
    phone: requestData["Mobile Number"] || requestData["Patient Contact"] || requestData.phone || null,
    alternateContact: requestData["Patient Alternate Contact"] || null,
    countryCode: requestData.country_code || requestData.countryCode || null,
    
    // Address
    address: {
      street: requestData.address || null,
      city: requestData["Org City"] || null,
      state: requestData.state || null,
      zipCode: requestData.zip_code || requestData.zipCode || null,
      country: null,
      landmark: requestData.landmark || null,
      areaOfResidence: requestData.areaOfResidance || requestData.areaOfResidence || null,
    },
    
    // Identification
    patientIdNumber: requestData["Patient Id"] || requestData.patientId || null,
    labPatientId: requestData.labPatientId || null,
    ssnNumber: requestData.ssnNumber || null,
    passportNumber: requestData.passportNumber || null,
    ethnicity: requestData.ethnicity || null,
    race: requestData.race || null,
    
    // Billing Information
    billId: requestData.billId ? String(requestData.billId) : null,
    billIdNumber: requestData.bill_id || requestData.billId || null,
    billTotalAmount: requestData.billTotalAmount || null,
    dueAmount: requestData.dueAmount || null,
    billAdvance: requestData.billAdvance || null,
    billConcession: requestData.billConcession || null,
    billTime: requestData.billTime && typeof requestData.billTime !== 'object' ? new Date(requestData.billTime) : null,
    billComments: requestData.billComments || null,
    billReferral: requestData.billReferral || null,
    orderNumber: requestData.orderNumber || null,
    
    // Test Information
    testId: requestData.testId ? String(requestData.testId) : null,
    testIdNumber: requestData.testId || null,
    testName: requestData.testName || (requestData.billInfoDetails && requestData.billInfoDetails[0]?.TestDetails?.TestName) || null,
    testCode: requestData.testCode || (requestData.billInfoDetails && requestData.billInfoDetails[0]?.TestDetails?.TestCode) || null,
    departmentName: requestData.departmentName || null,
    
    // Lab and Organization
    labId: requestData.labId?.labId || requestData.labId || null,
    labName: requestData.labId?.labName || null,
    orgId: requestData.orgId?.orgId || requestData.orgId || null,
    orgName: requestData.orgId?.orgFullName || null,
    orgCode: requestData["Org Code"] || null,
    orgType: requestData["org Type"] || null,
    orgEmail: requestData["Org email"] || null,
    orgContact: requestData["Org Contact"] || null,
    orgAddress: requestData["Org Address"] || null,
    orgCity: requestData["Org City"] || null,
    orgArea: requestData["Org Area"] || null,
    
    // Referral Information
    referralType: requestData["Referral Type"] || null,
    referralContact: requestData["Referral Contact"] || null,
    referralEmail: requestData["Referral Email"] || null,
    referralAddress: requestData["Referral Address"] || null,
    referralCity: requestData["Referral City"] || null,
    referralPincode: requestData["Referral pincode"] || null,
    referralRegNo: requestData["Referral RegNo"] || null,
    referralComments: requestData["Referral comments"] || null,
    
    // Metadata
    integrationPayload: requestData.integration_payload || null,
    webhookMetadata: requestData,
  };
  
  return data;
}

/**
 * Extract patient data from ReportStatusTracker entry
 */
function extractFromReportStatusTracker(requestData) {
  if (!requestData || typeof requestData !== 'object') return null;
  
  const data = {
    // Basic Information
    name: requestData["Patient Name"] || null,
    designation: requestData["Patient Designation"] || null,
    age: requestData.Age ? parseInt(requestData.Age) : null,
    gender: requestData.Gender || null,
    
    // Contact Information
    phone: requestData["Contact No"] || null,
    alternateContact: requestData.alternateContact || null,
    alternateEmail: requestData.alternateEmail || null,
    countryCode: requestData.countryCodeOfPatient || null,
    
    // Identification
    patientIdNumber: requestData["Patient Id"] || null,
    labPatientId: requestData.labPatientId || null,
    
    // Billing Information
    billId: requestData.billId ? String(requestData.billId) : null,
    billIdNumber: requestData.bill_id || requestData.billId || null,
    billPaymentStatus: requestData.reportDetails?.[0]?.billPaymentStatus || null,
    billPaymentMode: requestData.reportDetails?.[0]?.billPaymentMode || null,
    billReferral: requestData.billReferral || null,
    doctorNameFromReferral: extractDoctorNameFromReferral(requestData.billReferral), // Extract doctor name from billReferral
    
    // Test and Report Information
    testId: requestData.testId ? String(requestData.testId) : null,
    testIdNumber: requestData.testId || null,
    reportIdNumber: requestData.reportDetails?.[0]?.["Report Id"] || null,
    labReportId: requestData.reportDetails?.[0]?.labReportId || null,
    sampleId: requestData.reportDetails?.[0]?.sampleID || null,
    sampleDate: requestData.reportDetails?.[0]?.["Sample Date"] && typeof requestData.reportDetails[0]["Sample Date"] !== 'object' 
      ? new Date(requestData.reportDetails[0]["Sample Date"]) : null,
    accessionDate: requestData.reportDetails?.[0]?.["Accession Date"] && typeof requestData.reportDetails[0]["Accession Date"] !== 'object'
      ? new Date(requestData.reportDetails[0]["Accession Date"]) : null,
    testName: requestData.reportDetails?.[0]?.["Test Name"] || null,
    testCode: requestData.reportDetails?.[0]?.testCode || null,
    
    // Report Status and Doctor Information
    reportStatus: requestData.status || null,
    signingDoctor: requestData.reportDetails?.[0]?.["Signing Doctor"] || null,
    doctorNameFromSigningDoctor: extractDoctorNameFromSigningDoctor(requestData.reportDetails?.[0]?.["Signing Doctor"]), // Extract doctor name
    reportBase64: requestData.reportDetails?.[0]?.reportBase64 || null,
    fileAttachments: requestData.reportDetails?.[0]?.fileAttachments || null,
    fileInputReport: requestData.reportDetails?.[0]?.fileInputReport || null,
    isProfile: requestData.reportDetails?.[0]?.isProfile || null,
    profileID: requestData.reportDetails?.[0]?.profileID || null,
    reportDate: requestData.reportDetails?.[0]?.["Report Date"] && typeof requestData.reportDetails[0]["Report Date"] !== 'object'
      ? new Date(requestData.reportDetails[0]["Report Date"]) : null,
    approvalDate: requestData.reportDetails?.[0]?.["Approval Date"] && typeof requestData.reportDetails[0]["Approval Date"] !== 'object'
      ? new Date(requestData.reportDetails[0]["Approval Date"]) : null,
    reportFormatAndValues: requestData.reportDetails?.[0]?.reportFormatAndValues || null,
    
    // Lab and Organization
    labId: requestData.labId || null,
    orgId: requestData.orgId || null,
    referralId: requestData.referralId || null,
    
    // Metadata
    integrationPayload: requestData.integration_payload || null,
    webhookMetadata: requestData,
  };
  
  return data;
}

/**
 * Extract patient data from SampleStatusTracker entry
 */
function extractFromSampleStatusTracker(requestData) {
  if (!requestData || typeof requestData !== 'object') return null;
  
  const data = {
    // Contact Information
    email: requestData.patientEmail || null,
    phone: requestData.patientMobile || null,
    alternateEmail: requestData.patientAlternateEmail || null,
    
    // Billing Information
    billId: requestData.billId ? String(requestData.billId) : null,
    billIdNumber: requestData.bill_id || requestData.billId || null,
    
    // Test Information
    testId: requestData.testID?.[0] ? String(requestData.testID[0]) : null,
    testIdNumber: requestData.testID?.[0] || null,
    testCode: requestData.testCode?.[0] || null,
    sampleId: requestData.sampleId || null,
    accessionDate: requestData.accessionDate && typeof requestData.accessionDate !== 'object' ? new Date(requestData.accessionDate) : null,
    labReportId: requestData.CentreReportId?.[0] || null,
    
    // Lab Information
    labId: requestData.labId || null,
    
    // Metadata
    integrationPayload: requestData.integration_payload || null,
    webhookMetadata: requestData,
  };
  
  return data;
}

/**
 * Merge two patient data objects, prioritizing non-null values
 */
function mergePatientData(existing, newData) {
  const merged = { ...existing };
  const dateFields = ['billTime', 'sampleDate', 'accessionDate', 'dateOfBirth', 'reportDate', 'approvalDate'];
  
  for (const key in newData) {
    if (newData[key] === null || newData[key] === undefined) continue;
    
    // Handle date fields specially
    if (dateFields.includes(key)) {
      // Only set if it's a valid Date object
      if (newData[key] instanceof Date && !isNaN(newData[key].getTime())) {
        merged[key] = newData[key];
      }
      continue;
    }
    
    if (key === 'address' && typeof newData[key] === 'object' && !Array.isArray(newData[key])) {
      merged[key] = { ...(merged[key] || {}), ...newData[key] };
      // Remove null values from address
      Object.keys(merged[key]).forEach(k => {
        if (merged[key][k] === null) delete merged[key][k];
      });
    } else if (Array.isArray(newData[key])) {
      // For arrays like signingDoctor and fileAttachments, merge or replace
      if (key === 'signingDoctor' || key === 'fileAttachments' || key === 'reportFormatAndValues') {
        // Merge arrays, avoiding duplicates
        const existingArray = merged[key] || [];
        const newArray = newData[key] || [];
        // Simple merge - you might want more sophisticated deduplication
        merged[key] = [...existingArray, ...newArray];
      } else {
        merged[key] = newData[key];
      }
    } else if (typeof newData[key] === 'object' && newData[key] !== null && !(newData[key] instanceof Date)) {
      // Skip empty objects
      if (Object.keys(newData[key]).length > 0) {
        merged[key] = { ...(merged[key] || {}), ...newData[key] };
      }
    } else {
      // For primitive values, use new value if existing is null/undefined
      if (merged[key] === null || merged[key] === undefined || merged[key] === '') {
        merged[key] = newData[key];
      }
    }
  }
  
  return merged;
}

/**
 * Generate a unique patientId from available identifiers
 */
function generatePatientId(data) {
  // Try to use existing patientIdNumber
  if (data.patientIdNumber) {
    return `PAT-${data.patientIdNumber}`;
  }
  
  // Try to use labPatientId
  if (data.labPatientId) {
    return `LAB-PAT-${data.labPatientId}`;
  }
  
  // Try to use billId
  if (data.billId) {
    return `BILL-${data.billId}`;
  }
  
  // Fallback: generate from name and phone
  if (data.name && data.phone) {
    const namePart = data.name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const phonePart = data.phone.replace(/\D/g, '').substring(-4);
    return `PAT-${namePart}-${phonePart}`;
  }
  
  // Last resort: timestamp-based
  return `PAT-${Date.now()}`;
}

/**
 * Main consolidation function
 */
const consolidatePatientData = async () => {
  try {
    console.log("🔄 Starting patient data consolidation...");
    
    // Connect to database
    await connectDB();
    
    // Track statistics
    const stats = {
      requestDumps: 0,
      reportTrackers: 0,
      sampleTrackers: 0,
      reports: 0,
      existingPatients: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };
    
    // Map to store consolidated patient data
    // Key: patientId, Value: consolidated patient data
    const patientMap = new Map();
    
    // Step 1: Process existing Patient records
    console.log("\n📋 Step 1: Processing existing Patient records...");
    const existingPatients = await Patient.find({});
    stats.existingPatients = existingPatients.length;
    
    for (const patient of existingPatients) {
      const key = patient.patientId || generatePatientId(patient.toObject());
      patientMap.set(key, patient.toObject());
    }
    console.log(`   ✅ Processed ${existingPatients.length} existing patients`);
    
    // Step 2: Process RequestDump entries
    console.log("\n📋 Step 2: Processing RequestDump entries...");
    const requestDumps = await RequestDump.find({});
    stats.requestDumps = requestDumps.length;
    
    for (const dump of requestDumps) {
      try {
        const patientData = extractFromRequestDump(dump.request);
        if (!patientData || !patientData.name) continue;
        
        const patientId = generatePatientId(patientData);
        const existing = patientMap.get(patientId) || {};
        const merged = mergePatientData(existing, patientData);
        merged.patientId = patientId;
        
        patientMap.set(patientId, merged);
      } catch (error) {
        console.error(`   ⚠️  Error processing RequestDump ${dump._id}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`   ✅ Processed ${requestDumps.length} RequestDump entries`);
    
    // Step 3: Process ReportStatusTracker entries
    console.log("\n📋 Step 3: Processing ReportStatusTracker entries...");
    const reportTrackers = await ReportStatusTracker.find({});
    stats.reportTrackers = reportTrackers.length;
    
    for (const tracker of reportTrackers) {
      try {
        const patientData = extractFromReportStatusTracker(tracker.request);
        if (!patientData) continue;
        
        // Try to find existing patient by billId or patientIdNumber
        let patientId = null;
        if (patientData.billId) {
          // Find existing patient with this billId
          const existing = Array.from(patientMap.values()).find(
            p => p.billId === patientData.billId || p.billIdNumber === patientData.billIdNumber
          );
          if (existing) {
            patientId = existing.patientId;
          }
        }
        
        if (!patientId) {
          patientId = generatePatientId(patientData);
        }
        
        const existing = patientMap.get(patientId) || {};
        const merged = mergePatientData(existing, patientData);
        merged.patientId = patientId;
        
        patientMap.set(patientId, merged);
      } catch (error) {
        console.error(`   ⚠️  Error processing ReportStatusTracker ${tracker._id}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`   ✅ Processed ${reportTrackers.length} ReportStatusTracker entries`);
    
    // Step 4: Process SampleStatusTracker entries
    console.log("\n📋 Step 4: Processing SampleStatusTracker entries...");
    const sampleTrackers = await SampleStatusTracker.find({});
    stats.sampleTrackers = sampleTrackers.length;
    
    for (const tracker of sampleTrackers) {
      try {
        const patientData = extractFromSampleStatusTracker(tracker.request);
        if (!patientData) continue;
        
        // Try to find existing patient by billId
        let patientId = null;
        if (patientData.billId) {
          const existing = Array.from(patientMap.values()).find(
            p => p.billId === patientData.billId || p.billIdNumber === patientData.billIdNumber
          );
          if (existing) {
            patientId = existing.patientId;
          }
        }
        
        if (!patientId) {
          patientId = generatePatientId(patientData);
        }
        
        const existing = patientMap.get(patientId) || {};
        const merged = mergePatientData(existing, patientData);
        merged.patientId = patientId;
        
        patientMap.set(patientId, merged);
      } catch (error) {
        console.error(`   ⚠️  Error processing SampleStatusTracker ${tracker._id}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`   ✅ Processed ${sampleTrackers.length} SampleStatusTracker entries`);
    
    // Step 5: Process Report entries
    console.log("\n📋 Step 5: Processing Report entries...");
    const reports = await Report.find({});
    stats.reports = reports.length;
    
    for (const report of reports) {
      try {
        const patientData = extractFromReport(report.toObject());
        if (!patientData || (!patientData.billId && !patientData.billIdNumber)) continue;
        
        // Try to find existing patient by billId
        let patientId = null;
        if (patientData.billId || patientData.billIdNumber) {
          const existing = Array.from(patientMap.values()).find(
            p => (p.billId === patientData.billId) || 
                 (p.billIdNumber === patientData.billIdNumber) ||
                 (p.billId === String(patientData.billIdNumber)) ||
                 (String(p.billIdNumber) === patientData.billId)
          );
          if (existing) {
            patientId = existing.patientId;
          }
        }
        
        if (!patientId) {
          // Create a patient ID from billId if we can't find existing
          patientId = patientData.billId || `BILL-${patientData.billIdNumber}` || generatePatientId(patientData);
        }
        
        const existing = patientMap.get(patientId) || {};
        const merged = mergePatientData(existing, patientData);
        merged.patientId = patientId;
        
        patientMap.set(patientId, merged);
      } catch (error) {
        console.error(`   ⚠️  Error processing Report ${report._id}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`   ✅ Processed ${reports.length} Report entries`);
    
    // Step 6: Link doctors to patients
    console.log("\n📋 Step 6: Linking doctors to patients...");
    let doctorsLinked = 0;
    
    for (const [patientId, patientData] of patientMap.entries()) {
      try {
        // Try to find doctor from various sources
        let doctorId = null;
        
        // Priority 1: doctorNameFromSigningDoctor (most specific)
        if (patientData.doctorNameFromSigningDoctor) {
          doctorId = await findOrCreateDoctor(patientData.doctorNameFromSigningDoctor);
        }
        
        // Priority 2: doctorNameFromReferral (from billReferral)
        if (!doctorId && patientData.doctorNameFromReferral) {
          doctorId = await findOrCreateDoctor(patientData.doctorNameFromReferral, patientData.docId);
        }
        
        // Priority 3: Extract from signingDoctor array if not already extracted
        if (!doctorId && patientData.signingDoctor && Array.isArray(patientData.signingDoctor)) {
          const doctorName = extractDoctorNameFromSigningDoctor(patientData.signingDoctor);
          if (doctorName) {
            doctorId = await findOrCreateDoctor(doctorName);
          }
        }
        
        // Priority 4: Extract from billReferral if not already extracted
        if (!doctorId && patientData.billReferral) {
          const doctorName = extractDoctorNameFromReferral(patientData.billReferral);
          if (doctorName) {
            doctorId = await findOrCreateDoctor(doctorName, patientData.docId);
          }
        }
        
        if (doctorId) {
          patientData.assignedDoctor = doctorId;
          doctorsLinked++;
        }
        
        // Remove temporary doctor name fields (not needed in final patient record)
        delete patientData.doctorNameFromReferral;
        delete patientData.doctorNameFromSigningDoctor;
        delete patientData.docId;
      } catch (error) {
        console.error(`   ⚠️  Error linking doctor for patient ${patientId}:`, error.message);
      }
    }
    console.log(`   ✅ Linked ${doctorsLinked} doctors to patients`);
    
    // Step 7: Save consolidated patients to database
    console.log("\n📋 Step 7: Saving consolidated patients to database...");
    
    for (const [patientId, patientData] of patientMap.entries()) {
      try {
        // Clean up the data - remove null/undefined values from address
        if (patientData.address) {
          Object.keys(patientData.address).forEach(key => {
            if (patientData.address[key] === null || patientData.address[key] === undefined || patientData.address[key] === '') {
              delete patientData.address[key];
            }
          });
          if (Object.keys(patientData.address).length === 0) {
            delete patientData.address;
          }
        }
        
        // Fix date fields - remove invalid date objects
        const dateFields = ['billTime', 'sampleDate', 'accessionDate', 'dateOfBirth', 'reportDate', 'approvalDate'];
        dateFields.forEach(field => {
          if (patientData[field]) {
            // If it's an object (not a Date), remove it
            if (typeof patientData[field] === 'object' && !(patientData[field] instanceof Date)) {
              delete patientData[field];
            }
            // If it's an invalid date, remove it
            if (patientData[field] instanceof Date && isNaN(patientData[field].getTime())) {
              delete patientData[field];
            }
          }
        });
        
        // Remove empty arrays and null values
        Object.keys(patientData).forEach(key => {
          if (patientData[key] === null || patientData[key] === undefined || 
              (Array.isArray(patientData[key]) && patientData[key].length === 0) ||
              (typeof patientData[key] === 'object' && !Array.isArray(patientData[key]) && Object.keys(patientData[key]).length === 0)) {
            delete patientData[key];
          }
        });
        
        // Ensure name is present (required field)
        if (!patientData.name) {
          console.log(`   ⚠️  Skipping patient ${patientId}: missing required name field`);
          return;
        }
        
        // Check if patient already exists
        const existing = await Patient.findOne({ patientId });
        
        if (existing) {
          // Update existing patient
          await Patient.findOneAndUpdate(
            { patientId },
            { $set: patientData },
            { new: true, runValidators: true }
          );
          stats.updated++;
        } else {
          // Create new patient
          await Patient.create(patientData);
          stats.created++;
        }
      } catch (error) {
        console.error(`   ⚠️  Error saving patient ${patientId}:`, error.message);
        stats.errors++;
      }
    }
    
    // Summary
    console.log("\n📊 Consolidation Summary:");
    console.log(`   📥 RequestDump entries processed: ${stats.requestDumps}`);
    console.log(`   📥 ReportStatusTracker entries processed: ${stats.reportTrackers}`);
    console.log(`   📥 SampleStatusTracker entries processed: ${stats.sampleTrackers}`);
    console.log(`   📥 Report entries processed: ${stats.reports}`);
    console.log(`   📋 Existing patients processed: ${stats.existingPatients}`);
    console.log(`   ✅ Patients created: ${stats.created}`);
    console.log(`   🔄 Patients updated: ${stats.updated}`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   📊 Total unique patients: ${patientMap.size}`);
    
    // Final count
    const finalCount = await Patient.countDocuments();
    console.log(`\n📈 Final patient count in database: ${finalCount}`);
    
    console.log("\n🎉 Patient data consolidation completed successfully!");
  } catch (error) {
    console.error("❌ Error consolidating patient data:", error);
    throw error;
  } finally {
    // Disconnect from database
    await disconnectDB();
    process.exit(0);
  }
};

// Run the consolidation function
consolidatePatientData();
