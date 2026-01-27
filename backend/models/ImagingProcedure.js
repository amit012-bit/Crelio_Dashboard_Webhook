/**
 * ImagingProcedure Model
 * 
 * This model represents standard imaging procedures (e.g., MRI Brain, CT Abdomen).
 * It is used to map various test names from different sources to a standard procedure.
 * 
 * Fields:
 * - ProcedureName: Standardized name of the procedure
 * - ImagingType: Type of imaging (MRI, CT Scan, Ultrasound, X-Ray, etc.)
 */

import mongoose from "mongoose";

const imagingProcedureSchema = new mongoose.Schema(
  {
    ProcedureName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ImagingType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ImagingProcedure = mongoose.model("ImagingProcedure", imagingProcedureSchema);

export default ImagingProcedure;
