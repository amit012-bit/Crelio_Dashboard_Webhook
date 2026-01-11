import mongoose from "mongoose";

const reportStatusTrackerSchema = new mongoose.Schema({
  request: {
    type: Object,
    required: true,
  },
}, { timestamps: true });


const ReportStatusTracker = mongoose.model("ReportStatusTracker", reportStatusTrackerSchema);

export default ReportStatusTracker;