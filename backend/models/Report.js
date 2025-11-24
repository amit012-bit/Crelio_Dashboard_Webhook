/**
 * Report Model
 * 
 * This model represents a lab report/test result in the Crelio system.
 * Reports are created when webhook data is received and contain
 * the PDF report and associated metadata.
 * 
 * Fields:
 * - Report identification (reportId, billId, testId)
 * - Patient and doctor relationships
 * - Report data (PDF path, base64 data, file info)
 * - Status and workflow information
 * - Test details and results
 */

import mongoose from "mongoose";

// Define the report schema
const reportSchema = new mongoose.Schema(
  {
    // Report Identification
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    billId: {
      type: String,
      index: true,
      trim: true,
    },
    testId: {
      type: String,
      index: true,
      trim: true,
    },
    
    // Relationships
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    
    // Report Data
    reportBase64: {
      type: String,
      // Store base64 PDF data (can be large)
    },
    pdfPath: {
      type: String,
      trim: true,
      // Path to saved PDF file
    },
    fileSize: {
      type: Number, // Size in bytes
    },
    fileName: {
      type: String,
      trim: true,
    },
    
    // Test Information
    testName: {
      type: String,
      trim: true,
    },
    testType: {
      type: String,
      trim: true,
    },
    testCategory: {
      type: String,
      trim: true,
    },
    
    // Status
    status: {
      type: String,
      enum: [
        "Pending",
        "Sample Collected",
        "Under Analysis",
        "Report Generated",
        "Reviewed",
        "Delivered",
        "Archived",
      ],
      default: "Pending",
      // Note: Index is created via compound indexes below
    },
    
    // Dates
    testDate: {
      type: Date,
      default: Date.now,
    },
    reportGeneratedDate: {
      type: Date,
    },
    reportDeliveredDate: {
      type: Date,
    },
    
    // Additional metadata from webhook
    webhookMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Test Results (can be structured or free text)
    results: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Notes
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ status: 1, testDate: -1 });
reportSchema.index({ createdAt: -1 });

/**
 * Static method to get reports by status
 */
reportSchema.statics.getByStatus = function (status) {
  return this.find({ status }).populate("patient doctor");
};

/**
 * Static method to get reports for a patient
 */
reportSchema.statics.getByPatient = function (patientId) {
  return this.find({ patient: patientId }).sort({ createdAt: -1 });
};

/**
 * Static method to get reports generated today
 */
reportSchema.statics.getTodayReports = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    createdAt: {
      $gte: today,
      $lt: tomorrow,
    },
  });
};

// Create and export the Report model
const Report = mongoose.model("Report", reportSchema);

export default Report;

