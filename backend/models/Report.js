import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  labReportId: Number,
  billId: { type: Number, required: true },
  testId: { type: Number, required: true },
  status: { type: String, required: true },
  sampleDate: Date,

  signingDoctor: Array,   // comes when REPORT_SIGNED
  reportBase64: String,          // comes when REPORT_SUBMITTED
}, { timestamps: true });

reportSchema.index({ billId: 1, testId: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
