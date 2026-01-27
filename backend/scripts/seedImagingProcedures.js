/**
 * Database Seeding Script for ImagingProcedures
 * 
 * This script populates the ImagingProcedure table with standard procedure names
 * and updates existing TestInfo records to map to these procedures.
 * 
 * Usage: node scripts/seedImagingProcedures.js
 */

import dotenv from "dotenv";
import ImagingProcedure from "../models/ImagingProcedure.js";
import TestInfo from "../models/TestInfo.js";
import { connectDB, disconnectDB } from "../config/database.js";

// Load environment variables
dotenv.config();

/**
 * Standard imaging procedures data
 */
const procedureData = [
  // CT Scans
  { ProcedureName: "CT Abdomen & Pelvis", ImagingType: "CT Scan" },
  { ProcedureName: "CT Angiogram", ImagingType: "CT Scan" },
  { ProcedureName: "CT Brain", ImagingType: "CT Scan" },
  { ProcedureName: "CT Elbow", ImagingType: "CT Scan" },
  { ProcedureName: "CT Guided Biopsy", ImagingType: "CT Scan" },
  { ProcedureName: "CT KUB", ImagingType: "CT Scan" },
  { ProcedureName: "CT Lumbar Spine", ImagingType: "CT Scan" },
  { ProcedureName: "CT Neck", ImagingType: "CT Scan" },
  { ProcedureName: "CT Shoulder", ImagingType: "CT Scan" },
  { ProcedureName: "CT Thorax", ImagingType: "CT Scan" },
  { ProcedureName: "HRCT Thorax", ImagingType: "CT Scan" },

  // MRI
  { ProcedureName: "MRI Abdomen & Pelvis", ImagingType: "MRI" },
  { ProcedureName: "MRI Brain", ImagingType: "MRI" },
  { ProcedureName: "MRI Cervical Spine", ImagingType: "MRI" },
  { ProcedureName: "MRI LS Spine", ImagingType: "MRI" },
  { ProcedureName: "MRI Neck", ImagingType: "MRI" },
  { ProcedureName: "MRI Shoulder", ImagingType: "MRI" },
  { ProcedureName: "MRI Ankle", ImagingType: "MRI" },
  { ProcedureName: "MRI Knee Joint", ImagingType: "MRI" },
  { ProcedureName: "MRI Whole Spine Screening", ImagingType: "MRI" },

  // Ultrasound (USG)
  { ProcedureName: "USG Abdomen & Pelvis", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Breasts", ImagingType: "Ultrasound" },
  { ProcedureName: "USG KUB", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Neck", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Pelvis", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Scrotum", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Soft Tissue Scan", ImagingType: "Ultrasound" },
  { ProcedureName: "USG TRUS", ImagingType: "Ultrasound" },
  { ProcedureName: "Doppler Scan", ImagingType: "Ultrasound" },
  { ProcedureName: "USG Renal Doppler", ImagingType: "Ultrasound" },
  { ProcedureName: "Obstetric Doppler", ImagingType: "Ultrasound" },

  // X-Ray
  { ProcedureName: "X-Ray Abdomen", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Chest", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray C-Spine", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray L-S Spine", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Knee Joint", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Foot", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Ankle", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Hand", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray Shoulder", ImagingType: "X-Ray" },
  { ProcedureName: "X-Ray PNS", ImagingType: "X-Ray" },

  // Echocardiography
  { ProcedureName: "2D Echo", ImagingType: "Echocardiography" },
  { ProcedureName: "Fetal Echo", ImagingType: "Echocardiography" },
];

/**
 * Mapping rules for matching TestInfo to ImagingProcedure
 * Format: { searchPattern: "ProcedureName" }
 */
const mappingRules = [
  { pattern: /CT ABDOMEN/i, procedure: "CT Abdomen & Pelvis" },
  { pattern: /CT ANGIOGRAM/i, procedure: "CT Angiogram" },
  { pattern: /CT BRAIN/i, procedure: "CT Brain" },
  { pattern: /CT ELBOW/i, procedure: "CT Elbow" },
  { pattern: /CT.*BIOPSY/i, procedure: "CT Guided Biopsy" },
  { pattern: /CT KUB/i, procedure: "CT KUB" },
  { pattern: /CT LUMBAR/i, procedure: "CT Lumbar Spine" },
  { pattern: /CT NECK/i, procedure: "CT Neck" },
  { pattern: /CT SHOULDER/i, procedure: "CT Shoulder" },
  { pattern: /CT THORAX/i, procedure: "CT Thorax" },
  { pattern: /HRCT/i, procedure: "HRCT Thorax" },
  
  { pattern: /MRI ABDOMEN/i, procedure: "MRI Abdomen & Pelvis" },
  { pattern: /MRI BRAIN/i, procedure: "MRI Brain" },
  { pattern: /MRI CERVICAL/i, procedure: "MRI Cervical Spine" },
  { pattern: /MRI LS/i, procedure: "MRI LS Spine" },
  { pattern: /MRI NECK/i, procedure: "MRI Neck" },
  { pattern: /MRI SHOULDER/i, procedure: "MRI Shoulder" },
  { pattern: /MRI.*ANKLE/i, procedure: "MRI Ankle" },
  { pattern: /MRI-KNEE/i, procedure: "MRI Knee Joint" },
  { pattern: /MRI.*KNEE/i, procedure: "MRI Knee Joint" },
  { pattern: /MRI WHOLE SPINE/i, procedure: "MRI Whole Spine Screening" },

  { pattern: /USG ABDOMEN/i, procedure: "USG Abdomen & Pelvis" },
  { pattern: /USG BREAST/i, procedure: "USG Breasts" },
  { pattern: /USG KUB/i, procedure: "USG KUB" },
  { pattern: /USG NECK/i, procedure: "USG Neck" },
  { pattern: /USG PELVIS/i, procedure: "USG Pelvis" },
  { pattern: /USG SCROTUM/i, procedure: "USG Scrotum" },
  { pattern: /USG SOFT TISSUE/i, procedure: "USG Soft Tissue Scan" },
  { pattern: /USG TRUS/i, procedure: "USG TRUS" },
  { pattern: /PENILE DOPPLER/i, procedure: "Doppler Scan" },
  { pattern: /USG RENAL DOPPLER/i, procedure: "USG Renal Doppler" },
  { pattern: /OBSTETRIC DOPPLER/i, procedure: "Obstetric Doppler" },

  { pattern: /X-RAY ABDOMEN/i, procedure: "X-Ray Abdomen" },
  { pattern: /X-RAY CHEST/i, procedure: "X-Ray Chest" },
  { pattern: /X-RAY C SPINE/i, procedure: "X-Ray C-Spine" },
  { pattern: /X-RAY L S SPINE/i, procedure: "X-Ray L-S Spine" },
  { pattern: /X-RAY KNEE/i, procedure: "X-Ray Knee Joint" },
  { pattern: /X-RAY FOOT/i, procedure: "X-Ray Foot" },
  { pattern: /X-RAY.*ANKLE/i, procedure: "X-Ray Ankle" },
  { pattern: /X-RAY HAND/i, procedure: "X-Ray Hand" },
  { pattern: /X-RAY SHOULDER/i, procedure: "X-Ray Shoulder" },
  { pattern: /X-RAY PNS/i, procedure: "X-Ray PNS" },

  { pattern: /2D ECHO/i, procedure: "2D Echo" },
  { pattern: /FETAL ECHO/i, procedure: "Fetal Echo" },
];

const seedImagingProcedures = async () => {
  try {
    console.log("🌱 Starting ImagingProcedure seeding and mapping...");

    // Connect to database
    await connectDB();

    // Clear existing data in ImagingProcedure
    console.log("🗑️  Clearing existing ImagingProcedures...");
    await ImagingProcedure.deleteMany({});
    console.log("✅ ImagingProcedures cleared");

    // Seed ImagingProcedures
    console.log("📊 Seeding imaging procedures...");
    const procedures = [];
    for (const proc of procedureData) {
      const savedProc = await ImagingProcedure.create(proc);
      procedures.push(savedProc);
    }
    console.log(`✅ Created ${procedures.length} standard procedures`);

    // Map existing procedures for easy lookup
    const procedureMap = {};
    for (const proc of procedures) {
      procedureMap[proc.ProcedureName] = proc._id;
    }

    // Update TestInfo records
    console.log("🧪 Updating TestInfo mappings...");
    const allTests = await TestInfo.find({});
    let updatedCount = 0;

    for (const test of allTests) {
      // Try to find a matching procedure based on TestName
      const matchingRule = mappingRules.find(rule => rule.pattern.test(test.TestName));
      
      if (matchingRule) {
        const procedureId = procedureMap[matchingRule.procedure];
        if (procedureId) {
          test.ImagingProcedureID = procedureId;
          await test.save();
          updatedCount++;
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} TestInfo records with standard procedure mappings`);

    // Verify
    const imagingTestsCount = await TestInfo.countDocuments({ ImagingProcedureID: { $ne: null } });
    console.log(`\n📊 Verification:`);
    console.log(`   ✅ Total Tests: ${allTests.length}`);
    console.log(`   ✅ Tests with standard mappings: ${imagingTestsCount}`);

    console.log("\n🎉 ImagingProcedure seeding and mapping completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding imaging procedures:", error);
    throw error;
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Run the seeding function
seedImagingProcedures();
