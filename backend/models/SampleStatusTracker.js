import mongoose from "mongoose";

const sampleStatusTrackerSchema = new mongoose.Schema({
  request: {
    type: Object,
    required: true,
  },
}, { timestamps: true });


const SampleStatusTracker = mongoose.model("SampleStatusTracker", sampleStatusTrackerSchema);

export default  SampleStatusTracker;