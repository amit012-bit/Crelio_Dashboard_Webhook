import Patient from "../models/Patient.js";
import RequestDump from "../models/RequestDump.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import Report from "../models/Report.js";

export const getAllPatients = asyncHandler(async (req, res) => {

  const { page = 1, limit = 20, status, search, fromDate, toDate } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Handle date range: support both old 'date' parameter and new 'fromDate'/'toDate'
  let startDate, endDate;
  if (fromDate && toDate) {
    // Use date range if both fromDate and toDate are provided
    startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
  } else {
    // Default: today
    startDate = new Date(new Date().setHours(0, 0, 0, 0));
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
  }

  // Build query
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (status) query.status = status;
  if (search) {
    const searchNumber = Number(search);
    const isNumber = !isNaN(searchNumber);
    query.$or = [
      // Partial match on Patient Name (string)
      { "request.Patient Name": { $regex: search, $options: "i" } },
  
      // Partial match on billId (number)
      ...(isNumber ? [{
        $expr: {
          $regexMatch: {
            input: { $toString: "$request.billId" },
            regex: search,
            options: "i"
          }
        }
      }] : []),
  
      // Partial match on Patient Id (number)
      ...(isNumber ? [{
        $expr: {
          $regexMatch: {
            input: { $toString: "$request.Patient Id" },
            regex: search,
            options: "i"
          }
        }
      }] : [])
    ];
  }  

  const [patients, total] = await Promise.all([
    RequestDump.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    RequestDump.countDocuments(query),
  ]);

  res.json({
    success: true,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
    data: patients,
  });
});

export const getPatientBillById = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const bill = await RequestDump.findOne({
    "request.billId": Number(id)
  }).select("request");
  if (!bill) {
    return res.status(404).json({
      success: false,
      error: "Bill not found",
    });
  }
  return res.status(200).json({
    success: true,
    data: bill.request,
  });
});

export const getPatientTests = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const tests = await SampleStatusTracker.find({
    "request.billId": Number(id)
  }).select("request");
  return res.status(200).json({
    success: true,
    data: tests.map(test => test.request),
  });
});

export const getPatientReports = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const reports = await Report.find({
    billId: Number(id)
  });
  return res.status(200).json({
    success: true,
    data: reports,
  });
});
