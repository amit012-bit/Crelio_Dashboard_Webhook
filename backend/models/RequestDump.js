import mongoose from "mongoose";

const requestDumpSchema = new mongoose.Schema({
  request: {
    type: Object,
    required: true,
  },
}, { timestamps: true });


const RequestDump = mongoose.model("RequestDump", requestDumpSchema);

export default RequestDump;