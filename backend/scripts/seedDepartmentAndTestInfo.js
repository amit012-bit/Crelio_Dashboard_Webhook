/**
 * Database Seeding Script for DepartmentInfo and TestInfo
 * 
 * This script populates the database with:
 * - DepartmentInfo (departments)
 * - TestInfo (tests linked to departments via foreign keys)
 * 
 * Usage: node scripts/seedDepartmentAndTestInfo.js
 */

import dotenv from "dotenv";
import DepartmentInfo from "../models/DepartmentInfo.js";
import TestInfo from "../models/TestInfo.js";
import { connectDB, disconnectDB } from "../config/database.js";

// Load environment variables
dotenv.config();

/**
 * Department data to seed
 */
const departmentData = [
  "Pathology",
  "Radiology",
  "Immunology",
  "Haematology",
  "Serology",
  "Clinical Biochemistry",
  "Biochemistry",
];

/**
 * Test data to seed
 * Note: DepartmentID will be resolved from department names
 */
const testData = [
  { TestName: "CBC + ESR", TestCode: "CBC", DepartmentName: "Pathology" },
  { TestName: "Complete Blood Count (CBC)", TestCode: "CBC", DepartmentName: "Haematology" },
  { TestName: "USG Abdomen & Pelvis", TestCode: "USG ABDOMEN PELVIS", DepartmentName: "Radiology" },
  { TestName: "X-Ray Chest PA", TestCode: "X-RAY CHEST PA – RADIO", DepartmentName: "Radiology" },
  { TestName: "MRI Knee Joint", TestCode: "MRI-KNEE JOINT", DepartmentName: "Radiology" },
  { TestName: "Thyroid Profile (FT3, FT4, TSH)", TestCode: "THYROID PROFILE (FT3, FT4, TSH)", DepartmentName: "Immunology" },
  { TestName: "Follicular Study", TestCode: "FOLLICULAR STUDY – RADIO", DepartmentName: "Radiology" },
  { TestName: "Urine Pregnancy Test (UPT)", TestCode: "URINE PREGNANCY TEST (UPT) – CLP", DepartmentName: "Serology" },
  { TestName: "Pro-BNP", TestCode: "NT-pro BNP", DepartmentName: "Clinical Biochemistry" },
  { TestName: "FMR LIC", TestCode: "FMR LIC", DepartmentName: "Pathology" },
  { TestName: "MRI Brain (Plain & Contrast)", TestCode: "MRI BRAIN PLAIN & CONTRAST", DepartmentName: "Radiology" },
  { TestName: "USG Soft Tissue Scan", TestCode: "USG SOFT TISSUES SCAN", DepartmentName: "Radiology" },
  { TestName: "MRI Cervical Spine", TestCode: "MRI CERVICAL SPINE", DepartmentName: "Radiology" },
  { TestName: "HbA1c (Glycosylated Haemoglobin)", TestCode: "HbA1c – BCM", DepartmentName: "Biochemistry" },
];

/**
 * Main seeding function
 */
const seedDepartmentAndTestInfo = async () => {
  try {
    console.log("🌱 Starting DepartmentInfo and TestInfo seeding...");

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await TestInfo.deleteMany({});
    await DepartmentInfo.deleteMany({});
    console.log("✅ Existing data cleared");

    // Seed Departments
    console.log("📊 Seeding departments...");
    const departments = [];
    
    for (const deptName of departmentData) {
      // Use findOneAndUpdate with upsert to avoid duplicate key errors
      const department = await DepartmentInfo.findOneAndUpdate(
        { DepartmentName: deptName },
        { DepartmentName: deptName },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      departments.push(department);
    }
    
    console.log(`✅ Created/Updated ${departments.length} departments`);

    // Create a map of department names to ObjectIds for easy lookup
    const departmentMap = {};
    for (const dept of departments) {
      departmentMap[dept.DepartmentName] = dept._id;
    }

    // Seed Tests
    console.log("🧪 Seeding tests...");
    const tests = [];
    
    for (const test of testData) {
      const departmentId = departmentMap[test.DepartmentName];
      
      if (!departmentId) {
        console.warn(`⚠️  Department "${test.DepartmentName}" not found for test "${test.TestName}". Skipping...`);
        continue;
      }

      // Create test with foreign key reference
      const testDoc = await TestInfo.create({
        TestName: test.TestName,
        TestCode: test.TestCode,
        DepartmentID: departmentId,
      });
      
      tests.push(testDoc);
    }

    console.log(`✅ Created ${tests.length} tests`);

    // Verify data
    console.log("\n📊 Verification:");
    const departmentCount = await DepartmentInfo.countDocuments();
    const testCount = await TestInfo.countDocuments();
    console.log(`   ✅ Departments: ${departmentCount}`);
    console.log(`   ✅ Tests: ${testCount}`);

    // Show department breakdown
    console.log("\n📈 Department Breakdown:");
    for (const dept of departments) {
      const testCountForDept = await TestInfo.countDocuments({ DepartmentID: dept._id });
      console.log(`   ${dept.DepartmentName}: ${testCountForDept} tests`);
    }

    // Show sample tests with their departments
    console.log("\n🔍 Sample Tests (first 5):");
    const sampleTests = await TestInfo.find().limit(5).populate("DepartmentID", "DepartmentName");
    sampleTests.forEach((test) => {
      console.log(`   - ${test.TestName} (${test.TestCode}) → ${test.DepartmentID.DepartmentName}`);
    });

    console.log("\n🎉 DepartmentInfo and TestInfo seeding completed successfully!");
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
seedDepartmentAndTestInfo();
