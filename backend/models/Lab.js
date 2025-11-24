/**
 * Lab Model
 * 
 * This model represents a laboratory in the Crelio system.
 * Labs are associated with tests and reports.
 * 
 * Fields:
 * - Lab identification and contact information
 * - Lab type and capabilities
 * - Status and operational information
 */

import mongoose from "mongoose";

// Define the lab schema
const labSchema = new mongoose.Schema(
  {
    // Lab Identification
    labId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    labName: {
      type: String,
      required: true,
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
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    
    // Lab Information
    labType: {
      type: String,
      enum: [
        "Pathology",
        "Radiology",
        "Blood Test",
        "Urine Test",
        "Imaging",
        "General",
        "Specialized",
      ],
      default: "General",
    },
    capabilities: {
      type: [String], // List of test types this lab can perform
      default: [],
    },
    
    // Status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Maintenance"],
      default: "Active",
      // Note: Index is created via compound indexes below
    },
    
    // Operational Information
    operatingHours: {
      open: String, // e.g., "09:00"
      close: String, // e.g., "18:00"
    },
    
    // Test Count (denormalized for performance)
    testCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
labSchema.index({ status: 1, labType: 1 });

/**
 * Static method to get active labs
 */
labSchema.statics.getActiveLabs = function () {
  return this.find({ status: "Active" });
};

// Create and export the Lab model
const Lab = mongoose.model("Lab", labSchema);

export default Lab;

