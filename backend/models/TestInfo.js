/**
 * TestInfo Model
 * 
 * This model represents medical tests in the laboratory system.
 * Each test belongs to a department via foreign key reference.
 * 
 * Fields:
 * - TestName: Name of the test
 * - TestCode: Unique code for the test
 * - DepartmentID: Foreign key reference to DepartmentInfo._id
 * - Uses MongoDB's default _id as primary key
 */

import mongoose from "mongoose";

const testInfoSchema = new mongoose.Schema(
  {
    TestName: {
      type: String,
      required: true,
      trim: true,
    },
    TestCode: {
      type: String,
      required: true,
      trim: true,
    },
    DepartmentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentInfo",
      required: true,
      index: true, // Index for faster queries on foreign key
    },
    ImagingProcedureID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImagingProcedure",
      required: false, // Not all tests are imaging procedures
      index: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Compound index for TestCode and DepartmentID to ensure uniqueness if needed
testInfoSchema.index({ TestCode: 1, DepartmentID: 1 });

// Create and export the TestInfo model
const TestInfo = mongoose.model("TestInfo", testInfoSchema);

export default TestInfo;
