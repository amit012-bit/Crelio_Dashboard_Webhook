/**
 * DepartmentInfo Model
 * 
 * This model represents departments in the laboratory system.
 * Departments categorize different types of medical tests.
 * 
 * Fields:
 * - DepartmentName: Unique name of the department (e.g., Pathology, Radiology)
 * - Uses MongoDB's default _id as primary key
 */

import mongoose from "mongoose";

const departmentInfoSchema = new mongoose.Schema(
  {
    DepartmentName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create and export the DepartmentInfo model
const DepartmentInfo = mongoose.model("DepartmentInfo", departmentInfoSchema);

export default DepartmentInfo;
