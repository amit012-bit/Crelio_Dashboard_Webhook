/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for:
 * - Doctors (various specialties)
 * - Patients (with different statuses)
 * - Reports (linked to patients and doctors)
 * - Labs (laboratory information)
 * 
 * Usage: node scripts/seedData.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Report from "../models/Report.js";
import Lab from "../models/Lab.js";
import { connectDB, disconnectDB } from "../config/database.js";

// Load environment variables
dotenv.config();

/**
 * Generate random date within last N days
 */
const randomDate = (daysAgo = 30) => {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
};

/**
 * Generate random date in the future (for appointments)
 */
const futureDate = (daysAhead = 7) => {
  const now = new Date();
  return new Date(now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000);
};

/**
 * Sample doctor data
 */
const sampleDoctors = [
  {
    doctorId: "DOC-001",
    name: "Dr. Jaylon Stanton",
    email: "jaylon.stanton@crelio.com",
    phone: "+1-555-0101",
    specialty: "Dentist",
    qualifications: ["DDS", "MDS"],
    licenseNumber: "DENT-12345",
    experience: 12,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-002",
    name: "Dr. Carla Schleifer",
    email: "carla.schleifer@crelio.com",
    phone: "+1-555-0102",
    specialty: "Oculist",
    qualifications: ["MD", "Ophthalmology"],
    licenseNumber: "OPH-23456",
    experience: 15,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-003",
    name: "Dr. Hanna Geidt",
    email: "hanna.geidt@crelio.com",
    phone: "+1-555-0103",
    specialty: "Surgeon",
    qualifications: ["MD", "General Surgery"],
    licenseNumber: "SURG-34567",
    experience: 18,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-004",
    name: "Dr. Roger George",
    email: "roger.george@crelio.com",
    phone: "+1-555-0104",
    specialty: "General Practitioner",
    qualifications: ["MD", "Family Medicine"],
    licenseNumber: "GP-45678",
    experience: 10,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-005",
    name: "Dr. Natalie Doe",
    email: "natalie.doe@crelio.com",
    phone: "+1-555-0105",
    specialty: "Physician",
    qualifications: ["MD", "Internal Medicine"],
    licenseNumber: "PHYS-56789",
    experience: 8,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-006",
    name: "Dr. Michael Lee",
    email: "michael.lee@crelio.com",
    phone: "+1-555-0106",
    specialty: "Cardiologist",
    qualifications: ["MD", "Cardiology"],
    licenseNumber: "CARD-67890",
    experience: 20,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-007",
    name: "Dr. Sarah Gregory",
    email: "sarah.gregory@crelio.com",
    phone: "+1-555-0107",
    specialty: "Gynecologist",
    qualifications: ["MD", "Gynecology"],
    licenseNumber: "GYN-78901",
    experience: 14,
    status: "Active",
    profileImage: "",
  },
  {
    doctorId: "DOC-008",
    name: "Dr. James Wilson",
    email: "james.wilson@crelio.com",
    phone: "+1-555-0108",
    specialty: "Orthopedist",
    qualifications: ["MD", "Orthopedics"],
    licenseNumber: "ORTH-89012",
    experience: 16,
    status: "Active",
    profileImage: "",
  },
];

/**
 * Sample patient names
 */
const sampleNames = [
  "Natiya Johnson", "Vision Smith", "Robert Brown", "Emily Davis",
  "Michael Wilson", "Sarah Martinez", "David Anderson", "Jessica Taylor",
  "Christopher Thomas", "Amanda Jackson", "Matthew White", "Ashley Harris",
  "Daniel Martin", "Michelle Thompson", "Andrew Garcia", "Stephanie Martinez",
  "Joseph Robinson", "Nicole Clark", "William Rodriguez", "Lauren Lewis",
  "Richard Lee", "Samantha Walker", "Charles Hall", "Brittany Allen",
  "Thomas Young", "Rachel King", "Edward Wright", "Megan Lopez",
];

/**
 * Sample lab data
 */
const sampleLabs = [
  {
    labId: "LAB-001",
    labName: "Central Pathology Lab",
    email: "central@crelio.com",
    phone: "+1-555-0201",
    labType: "Pathology",
    capabilities: ["Blood Test", "Urine Test", "Biopsy", "Cytology"],
    status: "Active",
    operatingHours: { open: "08:00", close: "18:00" },
  },
  {
    labId: "LAB-002",
    labName: "Imaging Center",
    email: "imaging@crelio.com",
    phone: "+1-555-0202",
    labType: "Radiology",
    capabilities: ["X-Ray", "MRI", "CT Scan", "Ultrasound"],
    status: "Active",
    operatingHours: { open: "07:00", close: "20:00" },
  },
];

/**
 * Patient statuses with distribution
 */
const patientStatuses = [
  "Registered",
  "Lab Test Scheduled",
  "Sample Collected",
  "Under Review",
  "Report Generated",
  "Report Delivered",
  "Completed",
  "On Hold",
];

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Report.deleteMany({});
    await Lab.deleteMany({});
    console.log("✅ Existing data cleared");

    // Seed Labs
    console.log("📊 Seeding labs...");
    const labs = await Lab.insertMany(sampleLabs);
    console.log(`✅ Created ${labs.length} labs`);

    // Seed Doctors
    console.log("👨‍⚕️ Seeding doctors...");
    const doctors = await Doctor.insertMany(sampleDoctors);
    console.log(`✅ Created ${doctors.length} doctors`);

    // Seed Patients and Reports
    console.log("👥 Seeding patients and reports...");
    const patients = [];
    const reports = [];
    const today = new Date();

    // Generate patients with various statuses
    for (let i = 0; i < 50; i++) {
      const registrationDate = randomDate(60); // Last 60 days
      const statusIndex = Math.floor(Math.random() * patientStatuses.length);
      const status = patientStatuses[statusIndex];
      
      // Assign random doctor
      const assignedDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      
      // Generate patient ID
      const patientId = `PAT-${String(i + 1).padStart(6, "0")}`;
      const reportId = `REP-${String(i + 1).padStart(6, "0")}`;
      const billId = `BILL-${String(i + 1).padStart(6, "0")}`;
      const testId = `TEST-${String(i + 1).padStart(6, "0")}`;

      // Create patient
      const patient = await Patient.create({
        patientId,
        name: sampleNames[i % sampleNames.length],
        age: Math.floor(Math.random() * 60) + 20, // 20-80 years
        gender: Math.random() > 0.5 ? "Male" : "Female",
        email: `patient${i + 1}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"][
          Math.floor(Math.random() * 8)
        ],
        status,
        currentStage: status,
        assignedDoctor: assignedDoctor._id,
        billId,
        testId,
        reportId,
        registrationDate,
        lastVisitDate: registrationDate,
        webhookMetadata: {
          source: "seed_data",
          seededAt: new Date().toISOString(),
        },
      });

      patients.push(patient);

      // Create report for most patients
      if (Math.random() > 0.2) {
        // 80% of patients have reports
        const reportGeneratedDate = new Date(registrationDate);
        reportGeneratedDate.setDate(
          reportGeneratedDate.getDate() + Math.floor(Math.random() * 7)
        );

        const report = await Report.create({
          reportId,
          billId,
          testId,
          patient: patient._id,
          doctor: assignedDoctor._id,
          testName: [
            "Complete Blood Count",
            "Lipid Profile",
            "Liver Function Test",
            "Kidney Function Test",
            "Thyroid Function Test",
            "Diabetes Screening",
            "Vitamin D Test",
            "Cholesterol Test",
          ][Math.floor(Math.random() * 8)],
          testType: "Laboratory",
          testCategory: "General",
          status:
            status === "Completed"
              ? "Delivered"
              : status === "Report Generated"
              ? "Report Generated"
              : "Under Analysis",
          testDate: registrationDate,
          reportGeneratedDate,
          webhookMetadata: {
            source: "seed_data",
            seededAt: new Date().toISOString(),
          },
        });

        reports.push(report);

        // Link report to patient
        patient.labReports.push(report._id);
        await patient.save();
      }
    }

    console.log(`✅ Created ${patients.length} patients`);
    console.log(`✅ Created ${reports.length} reports`);

    // Update doctor patient counts
    console.log("📊 Updating doctor patient counts...");
    for (const doctor of doctors) {
      const patientCount = await Patient.countDocuments({
        assignedDoctor: doctor._id,
      });
      doctor.patientCount = patientCount;
      await doctor.save();
    }
    console.log("✅ Doctor patient counts updated");

    // Generate some recent patients (today)
    console.log("📅 Creating today's patients...");
    const todayPatients = [];
    for (let i = 0; i < 15; i++) {
      const assignedDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patientId = `PAT-${String(patients.length + i + 1).padStart(6, "0")}`;
      const reportId = `REP-${String(patients.length + i + 1).padStart(6, "0")}`;

      const patient = await Patient.create({
        patientId,
        name: sampleNames[(patients.length + i) % sampleNames.length],
        age: Math.floor(Math.random() * 60) + 20,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        email: `patient${patients.length + i + 1}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        status: ["Registered", "Lab Test Scheduled", "Sample Collected"][
          Math.floor(Math.random() * 3)
        ],
        currentStage: "Registration",
        assignedDoctor: assignedDoctor._id,
        registrationDate: today,
        lastVisitDate: today,
        webhookMetadata: {
          source: "seed_data",
          seededAt: new Date().toISOString(),
        },
      });

      todayPatients.push(patient);
    }
    console.log(`✅ Created ${todayPatients.length} patients for today`);

    // Summary
    console.log("\n📊 Seeding Summary:");
    console.log(`   ✅ Doctors: ${doctors.length}`);
    console.log(`   ✅ Labs: ${labs.length}`);
    console.log(`   ✅ Patients: ${patients.length + todayPatients.length}`);
    console.log(`   ✅ Reports: ${reports.length}`);
    console.log(`   ✅ Today's Patients: ${todayPatients.length}`);

    // Status breakdown
    const statusBreakdown = await Patient.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("\n📈 Patient Status Breakdown:");
    statusBreakdown.forEach((item) => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    // Disconnect from database
    await disconnectDB();
    process.exit(0);
  }
};

// Run the seeding function
seedDatabase();

