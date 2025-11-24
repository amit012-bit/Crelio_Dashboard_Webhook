/**
 * Dashboard Controller
 * 
 * This controller provides API endpoints for dashboard data.
 * It aggregates statistics and provides data for the frontend dashboard.
 * 
 * Features:
 * - Daily statistics (patients, reports, etc.)
 * - Patient status tracking
 * - Doctor and lab information
 * - Recent activity data
 */

import Patient from "../models/Patient.js";
import Report from "../models/Report.js";
import Doctor from "../models/Doctor.js";
import Lab from "../models/Lab.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Get dashboard statistics
 * 
 * GET /api/dashboard/stats
 * 
 * Returns overall statistics for the dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get yesterday for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Calculate statistics in parallel for better performance
  const [
    totalPatients,
    todayPatients,
    yesterdayPatients,
    totalReports,
    todayReports,
    totalDoctors,
    activeDoctors,
    patientsByStatus,
  ] = await Promise.all([
    // Total patients count
    Patient.countDocuments(),
    
    // Today's patients
    Patient.countDocuments({
      registrationDate: { $gte: today, $lt: tomorrow },
    }),
    
    // Yesterday's patients (for comparison)
    Patient.countDocuments({
      registrationDate: { $gte: yesterday, $lt: today },
    }),
    
    // Total reports
    Report.countDocuments(),
    
    // Today's reports
    Report.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    
    // Total doctors
    Doctor.countDocuments(),
    
    // Active doctors
    Doctor.countDocuments({ status: "Active" }),
    
    // Patients grouped by status
    Patient.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  
  // Format patients by status
  const statusBreakdown = {};
  patientsByStatus.forEach((item) => {
    statusBreakdown[item._id] = item.count;
  });
  
  // Calculate percentage change for today vs yesterday
  const patientChange = yesterdayPatients > 0
    ? ((todayPatients - yesterdayPatients) / yesterdayPatients * 100).toFixed(1)
    : todayPatients > 0 ? "100" : "0";
  
  res.json({
    success: true,
    data: {
      patients: {
        total: totalPatients,
        today: todayPatients,
        yesterday: yesterdayPatients,
        change: parseFloat(patientChange),
      },
      reports: {
        total: totalReports,
        today: todayReports,
      },
      doctors: {
        total: totalDoctors,
        active: activeDoctors,
      },
      statusBreakdown,
    },
  });
});

/**
 * Get today's patients
 * 
 * GET /api/dashboard/patients/today
 * 
 * Returns list of patients registered today
 */
export const getTodayPatients = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const patients = await Patient.find({
    registrationDate: { $gte: today, $lt: tomorrow },
  })
    .populate("assignedDoctor", "name specialty")
    .sort({ registrationDate: -1 })
    .limit(50); // Limit to 50 most recent
  
  res.json({
    success: true,
    count: patients.length,
    data: patients,
  });
});

/**
 * Get patients by status
 * 
 * GET /api/dashboard/patients/status/:status
 * 
 * Returns list of patients with specific status
 */
export const getPatientsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [patients, total] = await Promise.all([
    Patient.find({ status })
      .populate("assignedDoctor", "name specialty profileImage")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Patient.countDocuments({ status }),
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

/**
 * Get all patients with pagination
 * 
 * GET /api/dashboard/patients
 * 
 * Returns paginated list of all patients
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build query
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { patientId: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  
  const [patients, total] = await Promise.all([
    Patient.find(query)
      .populate("assignedDoctor", "name specialty profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Patient.countDocuments(query),
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

/**
 * Get patient details by ID
 * 
 * GET /api/dashboard/patients/:id
 * 
 * Returns detailed information about a specific patient
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const patient = await Patient.findById(id)
    .populate("assignedDoctor")
    .populate({
      path: "labReports",
      populate: {
        path: "doctor",
        select: "name specialty",
      },
    });
  
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: "Patient not found",
    });
  }
  
  res.json({
    success: true,
    data: patient,
  });
});

/**
 * Get all doctors
 * 
 * GET /api/dashboard/doctors
 * 
 * Returns list of all doctors
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
  const { status, specialty } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (specialty) query.specialty = specialty;
  
  const doctors = await Doctor.find(query)
    .sort({ name: 1 });
  
  // Get patient count for each doctor
  const doctorsWithCounts = await Promise.all(
    doctors.map(async (doctor) => {
      const patientCount = await Patient.countDocuments({
        assignedDoctor: doctor._id,
      });
      return {
        ...doctor.toObject(),
        patientCount,
      };
    })
  );
  
  res.json({
    success: true,
    count: doctorsWithCounts.length,
    data: doctorsWithCounts,
  });
});

/**
 * Get recent reports
 * 
 * GET /api/dashboard/reports/recent
 * 
 * Returns recent reports with patient and doctor information
 */
export const getRecentReports = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const reports = await Report.find()
    .populate("patient", "name patientId age gender")
    .populate("doctor", "name specialty")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  
  res.json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

/**
 * Get activity chart data
 * 
 * GET /api/dashboard/activity
 * 
 * Returns data for activity chart (consultations and patients over time)
 */
export const getActivityData = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));
  
  // Get patients grouped by month
  const patientsData = await Patient.aggregate([
    {
      $match: {
        registrationDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$registrationDate" },
          month: { $month: "$registrationDate" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);
  
  // Get reports grouped by month
  const reportsData = await Report.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);
  
  // Format data for chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const formattedData = patientsData.map((item) => ({
    month: monthNames[item._id.month - 1],
    patients: item.count,
    consultations: reportsData.find(
      (r) => r._id.year === item._id.year && r._id.month === item._id.month
    )?.count || 0,
  }));
  
  res.json({
    success: true,
    data: formattedData,
  });
});

/**
 * Get success stats by specialty
 * 
 * GET /api/dashboard/success-stats
 * 
 * Returns success statistics grouped by specialty
 */
export const getSuccessStats = asyncHandler(async (req, res) => {
  // Get doctors with their patient counts
  const doctors = await Doctor.find({ status: "Active" });
  
  const stats = await Promise.all(
    doctors.map(async (doctor) => {
      const totalPatients = await Patient.countDocuments({
        assignedDoctor: doctor._id,
      });
      const completedPatients = await Patient.countDocuments({
        assignedDoctor: doctor._id,
        status: "Completed",
      });
      
      return {
        specialty: doctor.specialty,
        total: totalPatients,
        completed: completedPatients,
        successRate: totalPatients > 0
          ? Math.round((completedPatients / totalPatients) * 100)
          : 0,
      };
    })
  );
  
  // Group by specialty and aggregate
  const specialtyStats = {};
  stats.forEach((stat) => {
    if (!specialtyStats[stat.specialty]) {
      specialtyStats[stat.specialty] = {
        specialty: stat.specialty,
        total: 0,
        completed: 0,
      };
    }
    specialtyStats[stat.specialty].total += stat.total;
    specialtyStats[stat.specialty].completed += stat.completed;
  });
  
  // Calculate success rates
  const result = Object.values(specialtyStats).map((stat) => ({
    ...stat,
    successRate: stat.total > 0
      ? Math.round((stat.completed / stat.total) * 100)
      : 0,
  }));
  
  res.json({
    success: true,
    data: result.sort((a, b) => b.successRate - a.successRate),
  });
});

