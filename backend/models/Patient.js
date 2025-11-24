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
    
    // Basic Information
    name: {
      type: String,
      required: true,
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
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
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
    
    // Webhook Information
    billId: {
      type: String,
      index: true,
    },
    testId: {
      type: String,
      index: true,
    },
    reportId: {
      type: String,
      index: true,
    },
    
    // Additional metadata from webhook
    webhookMetadata: {
      type: mongoose.Schema.Types.Mixed, // Store any additional webhook data
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

