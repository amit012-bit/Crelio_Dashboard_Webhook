/**
 * Patient Model
 * 
 * This model represents a patient in the Crelio system.
 * Patients are created when webhook data is received and contain
 * information extracted from the webhook payload.
 * 
 * Fields:
 * - Basic patient information (name, age, gender, contact)
 * - Medical information (blood group, allergies, medical history)
 * - Status tracking (current stage in workflow)
 * - Relationships (assigned doctor, lab reports)
 * - Timestamps (created, updated, last visit)
 */

import mongoose from "mongoose";

// Define the patient schema
const patientSchema = new mongoose.Schema(
  {
    // Patient Identification
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for faster queries
      trim: true,
    },
    labPatientId: {
      type: String,
      trim: true,
      index: true,
    },
    patientIdNumber: {
      type: Number, // From "Patient Id" in webhooks
      index: true,
    },
    
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String, // Mr., Mrs., Ms., Dr., etc.
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Not Specified"],
      default: "Not Specified",
    },
    dateOfBirth: {
      type: Date,
    },
    dateOfBirthString: {
      type: String, // Sometimes DOB comes as string like "-"
      trim: true,
    },
    
    // Contact Information
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
    },
    alternateContact: {
      type: String,
      trim: true,
    },
    alternateEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    countryCode: {
      type: String, // Country code for phone
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      landmark: String,
      areaOfResidence: String,
    },
    
    // Medical Information
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown",
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: String,
      trim: true,
    },
    
    // Identification Documents
    ssnNumber: {
      type: String,
      trim: true,
    },
    passportNumber: {
      type: String,
      trim: true,
    },
    ethnicity: {
      type: String,
      trim: true,
    },
    race: {
      type: String,
      trim: true,
    },
    
    // Status and Workflow
    status: {
      type: String,
      enum: [
        "Registered",
        "Lab Test Scheduled",
        "Sample Collected",
        "Under Review",
        "Report Generated",
        "Report Delivered",
        "Completed",
        "On Hold",
        "Cancelled",
      ],
      default: "Registered",
      // Note: Index is created via compound indexes below (no need for individual index)
    },
    currentStage: {
      type: String,
      default: "Registration",
    },
    
    // Relationships
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    labReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    
    // Billing Information
    billId: {
      type: String,
      index: true,
    },
    billIdNumber: {
      type: Number, // From "bill_id" in webhooks
      index: true,
    },
    billTotalAmount: {
      type: Number,
    },
    dueAmount: {
      type: Number,
    },
    billAdvance: {
      type: Number,
    },
    billConcession: {
      type: Number,
    },
    billPaymentStatus: {
      type: Number, // 0 or 1
    },
    billPaymentMode: {
      type: String, // CASH, CARD, etc.
      trim: true,
    },
    billTime: {
      type: Date,
    },
    billComments: {
      type: String,
      trim: true,
    },
    billReferral: {
      type: String, // Referral doctor or "SELF"
      trim: true,
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    
    // Test and Report Information
    testId: {
      type: String,
      index: true,
    },
    testIdNumber: {
      type: Number, // From "testID" in webhooks
      index: true,
    },
    reportId: {
      type: String,
      index: true,
    },
    reportIdNumber: {
      type: Number, // From "Report Id" in webhooks
      index: true,
    },
    labReportId: {
      type: Number, // From "labReportId" in webhooks
      index: true,
    },
    sampleId: {
      type: String,
      trim: true,
      index: true,
    },
    sampleDate: {
      type: Date,
    },
    accessionDate: {
      type: Date,
    },
    testName: {
      type: String,
      trim: true,
    },
    testCode: {
      type: String,
      trim: true,
    },
    departmentName: {
      type: String,
      trim: true,
    },
    
    // Report and Doctor Information
    reportStatus: {
      type: String, // From Report.status
      trim: true,
    },
    signingDoctor: {
      type: [mongoose.Schema.Types.Mixed], // Array of objects like [{"Signing Doctor 1": "Dr. Name"}]
      default: [],
    },
    reportBase64: {
      type: String, // Base64 encoded PDF report
    },
    fileAttachments: {
      type: [mongoose.Schema.Types.Mixed], // Array of file attachment objects
      default: [],
    },
    fileInputReport: {
      type: Number, // 0 or 1 flag
    },
    isProfile: {
      type: Number, // 0 or 1 flag
    },
    profileID: {
      type: Number,
    },
    reportDate: {
      type: Date,
    },
    approvalDate: {
      type: Date,
    },
    reportFormatAndValues: {
      type: [mongoose.Schema.Types.Mixed], // Array of report format and test values
      default: [],
    },
    
    // Lab and Organization Information
    labId: {
      type: Number,
      index: true,
    },
    labName: {
      type: String,
      trim: true,
    },
    orgId: {
      type: Number,
      index: true,
    },
    orgName: {
      type: String,
      trim: true,
    },
    orgCode: {
      type: String,
      trim: true,
    },
    orgType: {
      type: String,
      trim: true,
    },
    orgEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    orgContact: {
      type: String,
      trim: true,
    },
    orgAddress: {
      type: String,
      trim: true,
    },
    orgCity: {
      type: String,
      trim: true,
    },
    orgArea: {
      type: String,
      trim: true,
    },
    
    // Referral Information
    referralId: {
      type: Number,
    },
    referralType: {
      type: String,
      trim: true,
    },
    referralContact: {
      type: String,
      trim: true,
    },
    referralEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    referralAddress: {
      type: String,
      trim: true,
    },
    referralCity: {
      type: String,
      trim: true,
    },
    referralPincode: {
      type: String,
      trim: true,
    },
    referralRegNo: {
      type: String,
      trim: true,
    },
    referralComments: {
      type: String,
      trim: true,
    },
    
    // Additional metadata from webhook
    webhookMetadata: {
      type: mongoose.Schema.Types.Mixed, // Store any additional webhook data
      default: {},
    },
    integrationPayload: {
      type: mongoose.Schema.Types.Mixed, // Store integration_payload from webhooks
      default: {},
    },
    
    // Timestamps
    lastVisitDate: {
      type: Date,
      default: Date.now,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Index for faster queries on common fields
patientSchema.index({ status: 1, registrationDate: -1 });
patientSchema.index({ assignedDoctor: 1, status: 1 });
patientSchema.index({ createdAt: -1 }); // For recent patients query
patientSchema.index({ billId: 1, testId: 1 }); // For webhook lookups
patientSchema.index({ labId: 1, orgId: 1 }); // For lab/organization queries
// Note: patientIdNumber is already indexed in schema definition above

/**
 * Instance method to get patient's full address as string
 */
patientSchema.methods.getFullAddress = function () {
  const addr = this.address;
  if (!addr) return "";
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(", ");
};

/**
 * Static method to get patients by status
 */
patientSchema.statics.getByStatus = function (status) {
  return this.find({ status });
};

/**
 * Static method to get patients registered today
 */
patientSchema.statics.getTodayPatients = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    registrationDate: {
      $gte: today,
      $lt: tomorrow,
    },
  });
};

// Create and export the Patient model
const Patient = mongoose.model("Patient", patientSchema);

export default Patient;

