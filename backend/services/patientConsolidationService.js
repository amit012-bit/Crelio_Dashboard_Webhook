/**
 * Patient Consolidation Service
 * 
 * This service consolidates patient data from webhook sources into the Patient table.
 * It can be called automatically after webhook data is inserted.
 * 
 * Functions:
 * - consolidatePatientFromWebhook: Consolidates a single patient from webhook data
 * - consolidatePatientFromBillId: Consolidates patient data for a specific billId
 */

import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import RequestDump from "../models/RequestDump.js";
import ReportStatusTracker from "../models/ReportStatusTracker.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";
import Report from "../models/Report.js";

// Import helper functions from consolidation script
// We'll need to extract these functions or import them

/**
 * Extract doctor name from billReferral string
 */
function extractDoctorNameFromReferral(billReferral) {
  if (!billReferral || typeof billReferral !== 'string') return null;
  if (billReferral === 'SELF' || billReferral.trim() === '') return null;
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
    }
    
    return doctor._id;
  } catch (error) {
    console.error(`⚠️  Error finding/creating doctor ${doctorName}:`, error.message);
    return null;
  }
}

/**
 * Consolidate patient data for a specific billId
 * This is called automatically after webhook data is inserted
 */
export async function consolidatePatientFromBillId(billId, billIdNumber = null) {
  try {
    // Find existing patient by billId
    let existingPatient = await Patient.findOne({
      $or: [
        { billId: String(billId) },
        { billIdNumber: parseInt(billId) },
        { billIdNumber: parseInt(billIdNumber || billId) }
      ]
    });
    
    // Get RequestDump for patient information
    const requestDump = await RequestDump.findOne({
      $or: [
        { 'request.billId': billId },
        { 'request.bill_id': billIdNumber || billId },
        { 'request.billId': parseInt(billId) },
        { 'request.bill_id': parseInt(billIdNumber || billId) }
      ]
    });
    
    if (!existingPatient && requestDump?.request) {
      // New patient - create from RequestDump data
      const req = requestDump.request;
      const patientName = req["Patient Name"] || req.patientName;
      
      if (patientName) {
        // Generate patientId
        const patientIdNumber = req["Patient Id"] || req.patientId;
        const patientId = patientIdNumber ? `PAT-${patientIdNumber}` : `BILL-${billId}`;
        
        // Create new patient
        const newPatientData = {
          patientId: patientId,
          name: patientName,
          designation: req["Patient Designation"] || null,
          age: req["Patient Age"] ? parseInt(req["Patient Age"]) : null,
          gender: req["Patient gender"] || req.gender || null,
          phone: req["Mobile Number"] || req["Patient Contact"] || req.phone || null,
          email: req.patient_email || req.email || null,
          billId: String(billId),
          billIdNumber: parseInt(billIdNumber || billId),
          billTotalAmount: req.billTotalAmount || null,
          dueAmount: req.dueAmount || null,
          billReferral: req.billReferral || null,
          patientIdNumber: patientIdNumber || null,
          labPatientId: req.labPatientId || null,
        };
        
        // Link doctor if available
        if (req.billReferral) {
          const doctorName = extractDoctorNameFromReferral(req.billReferral);
          if (doctorName) {
            const doctorId = await findOrCreateDoctor(doctorName, req.docId);
            if (doctorId) {
              newPatientData.assignedDoctor = doctorId;
            }
          }
        }
        
        await Patient.create(newPatientData);
        console.log(`✅ Created new patient ${patientId} from webhook data`);
        existingPatient = await Patient.findOne({ patientId });
      } else {
        // No patient name - will be handled by full consolidation
        console.log(`📋 New patient detected for billId ${billId} - will be processed in next full consolidation`);
        return;
      }
    }
    
    if (!existingPatient) {
      return; // Could not create or find patient
    }
    
    // Update existing patient with latest data from all sources
    const updateData = {};
    
    // Get latest Report data
    const report = await Report.findOne({
      $or: [
        { billId: parseInt(billId) },
        { billId: parseInt(billIdNumber || billId) }
      ]
    });
    
    if (report) {
      if (report.signingDoctor) updateData.signingDoctor = report.signingDoctor;
      if (report.reportBase64) updateData.reportBase64 = report.reportBase64;
      if (report.status) updateData.reportStatus = report.status;
      if (report.sampleDate) updateData.sampleDate = report.sampleDate;
    }
    
    // Get latest ReportStatusTracker data
    const reportTracker = await ReportStatusTracker.findOne({
      $or: [
        { 'request.billId': billId },
        { 'request.bill_id': billIdNumber || billId },
        { 'request.billId': parseInt(billId) },
        { 'request.bill_id': parseInt(billIdNumber || billId) }
      ]
    }).sort({ createdAt: -1 }); // Get most recent
    
    if (reportTracker?.request) {
      const req = reportTracker.request;
      if (req.reportDetails?.[0]?.["Signing Doctor"]) {
        updateData.signingDoctor = req.reportDetails[0]["Signing Doctor"];
      }
      if (req.reportDetails?.[0]?.reportBase64) {
        updateData.reportBase64 = req.reportDetails[0].reportBase64;
      }
      if (req.status) {
        updateData.reportStatus = req.status;
      }
      if (req.reportDetails?.[0]?.["Sample Date"] && typeof req.reportDetails[0]["Sample Date"] !== 'object') {
        updateData.sampleDate = new Date(req.reportDetails[0]["Sample Date"]);
      }
      if (req.reportDetails?.[0]?.["Accession Date"] && typeof req.reportDetails[0]["Accession Date"] !== 'object') {
        updateData.accessionDate = new Date(req.reportDetails[0]["Accession Date"]);
      }
    }
    
    // Link doctor if not already linked
    if (!existingPatient.assignedDoctor) {
      let doctorId = null;
      
      // Try from billReferral
      if (requestDump?.request?.billReferral) {
        const doctorName = extractDoctorNameFromReferral(requestDump.request.billReferral);
        if (doctorName) {
          doctorId = await findOrCreateDoctor(doctorName, requestDump.request.docId);
        }
      }
      
      // Try from signingDoctor
      if (!doctorId && updateData.signingDoctor) {
        const doctorName = extractDoctorNameFromSigningDoctor(updateData.signingDoctor);
        if (doctorName) {
          doctorId = await findOrCreateDoctor(doctorName);
        }
      }
      
      if (doctorId) {
        updateData.assignedDoctor = doctorId;
      }
    }
    
    // Update patient with new data
    if (Object.keys(updateData).length > 0) {
      await Patient.findByIdAndUpdate(existingPatient._id, { $set: updateData });
      console.log(`✅ Updated patient ${existingPatient.patientId} with latest webhook data`);
    }
    
  } catch (error) {
    console.error("⚠️  Error consolidating patient from billId:", error.message);
    // Don't throw - we don't want to break webhook processing
  }
}

/**
 * Trigger full consolidation (processes all unprocessed data)
 * This is called for new patients or when needed
 * Note: Full consolidation should be run manually via npm run consolidate:patients
 * for comprehensive data processing
 */
async function triggerFullConsolidation() {
  console.log("📋 New patient detected - run 'npm run consolidate:patients' for full consolidation");
}

/**
 * Consolidate patient from webhook data immediately after insertion
 * This is the main function called from webhook handlers
 */
export async function consolidatePatientFromWebhook(webhookType, webhookData) {
  try {
    // Extract billId from webhook data
    let billId = null;
    let billIdNumber = null;
    
    if (webhookType === 'billGenerate') {
      billId = webhookData.billId;
      billIdNumber = webhookData.bill_id || webhookData.billId;
    } else if (webhookType === 'reportStatus') {
      billId = webhookData.billId;
      billIdNumber = webhookData.bill_id || webhookData.billId;
    } else if (webhookType === 'sampleStatus') {
      billId = webhookData.billId;
      billIdNumber = webhookData.bill_id || webhookData.billId;
    }
    
    if (billId || billIdNumber) {
      // Run consolidation asynchronously (don't block webhook response)
      setImmediate(() => {
        consolidatePatientFromBillId(billId, billIdNumber).catch(err => {
          console.error("⚠️  Background consolidation error:", err.message);
        });
      });
    }
  } catch (error) {
    console.error("⚠️  Error in consolidatePatientFromWebhook:", error.message);
    // Don't throw - we don't want to break webhook processing
  }
}
