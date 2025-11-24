/**
 * Doctor Model
 * 
 * This model represents a doctor/physician in the Crelio system.
 * Doctors can be assigned to patients and have specialties.
 * 
 * Fields:
 * - Basic information (name, email, phone)
 * - Professional information (specialty, qualifications, license)
 * - Status (active, on leave, etc.)
 * - Patient assignments
 */

import mongoose from "mongoose";

// Define the doctor schema
const doctorSchema = new mongoose.Schema(
  {
    // Doctor Identification
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Professional Information
    specialty: {
      type: String,
      required: true,
      trim: true,
      // Common specialties
      enum: [
        "General Practitioner",
        "Cardiologist",
        "Dermatologist",
        "Dentist",
        "Oculist",
        "Surgeon",
        "Physician",
        "Gynecologist",
        "Neurologist",
        "Oncologist",
        "Orthopedist",
        "Physiotherapist",
        "Anesthesiologist",
        "Other",
      ],
      default: "General Practitioner",
    },
    qualifications: {
      type: [String],
      default: [],
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number, // Years of experience
      min: 0,
    },
    
    // Status
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
      // Note: Index is created via compound indexes below
    },
    
    // Patient Count (denormalized for performance)
    patientCount: {
      type: Number,
      default: 0,
    },
    
    // Profile Image URL (optional)
    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
doctorSchema.index({ specialty: 1, status: 1 });
doctorSchema.index({ status: 1 });

/**
 * Static method to get active doctors
 */
doctorSchema.statics.getActiveDoctors = function () {
  return this.find({ status: "Active" });
};

/**
 * Static method to get doctors by specialty
 */
doctorSchema.statics.getBySpecialty = function (specialty) {
  return this.find({ specialty, status: "Active" });
};

// Create and export the Doctor model
const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;

