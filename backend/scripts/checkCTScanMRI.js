/**
 * Script to check for all imaging/scan tests in the database
 * 
 * This script searches through all collections to find any records
 * containing imaging tests like: CT Scan, MRI, Ultrasound, X-Ray, etc.
 * 
 * Usage: node scripts/checkCTScanMRI.js
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import RequestDump from "../models/RequestDump.js";
import SampleStatusTracker from "../models/SampleStatusTracker.js";
import ReportStatusTracker from "../models/ReportStatusTracker.js";
import Report from "../models/Report.js";
import Patient from "../models/Patient.js";
import { connectDB, disconnectDB } from "../config/database.js";

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize text for matching (lowercase, remove punctuation)
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

/**
 * Determine imaging/scan type from test name
 */
function getImagingType(testName) {
  const normalized = normalizeText(testName);
  
  // X-Ray
  if (/\b(x[\s-]?ray|radiography)\b/.test(normalized)) return 'X-Ray';
  
  // CT Scan
  if (/\b(ct[\s-]?scan|ctscan|ct|computed[\s-]?tomography|cardiac[\s-]?ct|hrct|cbct|cone[\s-]?beam[\s-]?ct)\b/.test(normalized)) return 'CT Scan';
  
  // MRI
  if (/\b(mri[\s-]?scan|mri|magnetic[\s-]?resonance|functional[\s-]?mri|fmri|cardiac[\s-]?mri)\b/.test(normalized)) return 'MRI';
  
  // Ultrasound
  if (/\b(ultrasound|usg|us|sonography|echography|doppler|color[\s-]?doppler)\b/.test(normalized)) return 'Ultrasound';
  
  // Echocardiography
  if (/\b(echo|2d[\s-]?echo|echocardiography|tmt[\s-]?echo)\b/.test(normalized)) return 'Echocardiography';
  
  // Mammography
  if (/\b(mammography|mammogram)\b/.test(normalized)) return 'Mammography';
  
  // DEXA
  if (/\b(dexa|dexa[\s-]?scan|bone[\s-]?density)\b/.test(normalized)) return 'DEXA';
  
  // Nuclear Medicine
  if (/\b(pet|pet[\s-]?scan|spect|spect[\s-]?scan|bone[\s-]?scan|thyroid[\s-]?scan|renal[\s-]?scan|gallium[\s-]?scan|muga[\s-]?scan|vq[\s-]?scan|v\/q[\s-]?scan|nuclear[\s-]?medicine)\b/.test(normalized)) return 'Nuclear Medicine';
  
  // Fluoroscopy
  if (/\b(fluoroscopy)\b/.test(normalized)) return 'Fluoroscopy';
  
  // Angiography
  if (/\b(angiography|angiogram|ct[\s-]?angiography|mr[\s-]?angiography)\b/.test(normalized)) return 'Angiography';
  
  // GI / Contrast Studies
  if (/\b(barium[\s-]?swallow|barium[\s-]?meal|barium[\s-]?enema|hsg|hysterosalpingography|ivp|ivu|intravenous[\s-]?pyelogram|intravenous[\s-]?urogram)\b/.test(normalized)) return 'GI/Contrast Study';
  
  // Endoscopy
  if (/\b(endoscopy|colonoscopy|sigmoidoscopy|bronchoscopy|cystoscopy|laparoscopy)\b/.test(normalized)) return 'Endoscopy';
  
  // Other Imaging
  if (/\b(elastography|fibroscan|oct|optical[\s-]?coherence[\s-]?tomography|myelography|arthrography)\b/.test(normalized)) return 'Other Imaging';
  
  return 'Unknown';
}

/**
 * Check if text contains any imaging/scan terms
 */
function containsImagingTerm(text) {
  if (!text || typeof text !== 'string') return false;
  
  const normalized = normalizeText(text);
  const searchTerms = [
    // X-Ray
    'x ray', 'xray', 'radiography',
    // CT Scan
    'ct scan', 'ctscan', 'ct', 'computed tomography', 'cardiac ct', 'hrct', 'cbct', 'cone beam ct',
    // MRI
    'mri', 'mri scan', 'magnetic resonance', 'magnetic resonance imaging', 'functional mri', 'fmri', 'cardiac mri',
    // Ultrasound
    'ultrasound', 'usg', 'us', 'sonography', 'echography', 'doppler', 'doppler ultrasound', 'color doppler',
    // Echocardiography
    'echo', '2d echo', 'echocardiography', 'tmt echo',
    // Mammography
    'mammography', 'mammogram',
    // DEXA
    'dexa', 'dexa scan', 'bone density', 'bone density scan',
    // Nuclear Medicine
    'pet', 'pet scan', 'spect', 'spect scan', 'bone scan', 'thyroid scan', 'renal scan', 'gallium scan', 'muga scan', 'vq scan', 'v/q scan', 'nuclear medicine',
    // Fluoroscopy
    'fluoroscopy',
    // Angiography
    'angiography', 'angiogram', 'ct angiography', 'mr angiography',
    // GI / Contrast Studies
    'barium swallow', 'barium meal', 'barium enema', 'hsg', 'hysterosalpingography', 'ivp', 'ivu', 'intravenous pyelogram', 'intravenous urogram',
    // Endoscopy
    'endoscopy', 'colonoscopy', 'sigmoidoscopy', 'bronchoscopy', 'cystoscopy', 'laparoscopy',
    // Other Imaging
    'elastography', 'fibroscan', 'oct', 'optical coherence tomography', 'myelography', 'arthrography'
  ];
  
  return searchTerms.some(term => normalized.includes(term));
}

/**
 * Search for imaging/scan tests in a collection
 */
async function searchInCollection(collection, collectionName, searchFields) {
  console.log(`\n🔍 Searching in ${collectionName}...`);
  
  const results = [];
  
  try {
    // For RequestDump, we need to search all documents and check nested structures
    // For other collections, we'll also search all and filter in memory for better accuracy
    let docs;
    if (collectionName === 'RequestDump') {
      // Get all RequestDump documents to check nested structures
      docs = await collection.find({}).limit(500);
    } else {
      // For other collections, get more documents to check
      docs = await collection.find({}).limit(500);
    }
    
    for (const doc of docs) {
      // Check each search field
      for (const field of searchFields) {
        const value = getNestedValue(doc, field);
        if (value) {
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
          if (containsImagingTerm(valueStr)) {
            const imagingType = getImagingType(valueStr);
            let testName;
            if (typeof value === 'string') {
              testName = value;
            } else if (Array.isArray(value)) {
              // If it's an array, check each element
              value.forEach(item => {
                const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
                if (containsImagingTerm(itemStr)) {
                  const itemImagingType = getImagingType(itemStr);
                  const itemTestName = typeof item === 'string' ? item : itemStr.substring(0, 200);
                  const isDuplicate = results.some(r => 
                    r.testName === itemTestName && 
                    r.field === field &&
                    r.collection === collectionName
                  );
                  if (!isDuplicate && itemTestName) {
                    results.push({
                      _id: doc._id,
                      field: field,
                      testName: itemTestName,
                      imagingType: itemImagingType,
                      collection: collectionName,
                      billId: doc.request?.billId || doc.billId || null,
                      patientName: doc.request?.['Patient Name'] || doc.name || null,
                      createdAt: doc.createdAt || null
                    });
                  }
                }
              });
              continue; // Skip the rest for arrays
            } else {
              testName = valueStr.length > 200 ? valueStr.substring(0, 200) + '...' : valueStr;
            }
            
            // Avoid duplicates
            const isDuplicate = results.some(r => 
              r.testName === testName && 
              r.field === field &&
              r.collection === collectionName
            );
            if (!isDuplicate && testName) {
              results.push({
                _id: doc._id,
                field: field,
                testName: testName,
                imagingType: imagingType,
                collection: collectionName,
                billId: doc.request?.billId || doc.billId || null,
                patientName: doc.request?.['Patient Name'] || doc.name || null,
                createdAt: doc.createdAt || null
              });
            }
          }
        }
      }
      
      // Also check nested structures like billInfoDetails
      if (doc.request) {
        const request = doc.request;
        
        // Check billInfoDetails
        if (request.billInfoDetails && Array.isArray(request.billInfoDetails)) {
          for (const billInfo of request.billInfoDetails) {
            const testName = billInfo.testname || billInfo.TestDetails?.TestName || billInfo.TestDetails?.testName;
            if (testName && containsImagingTerm(testName)) {
              const imagingType = getImagingType(testName);
              // Avoid duplicates - check if we already have this test
              const isDuplicate = results.some(r => 
                r.testName === testName && 
                r.billId === (request.billId || null) &&
                r.collection === collectionName
              );
              if (!isDuplicate) {
                results.push({
                  _id: doc._id,
                  field: 'billInfoDetails.testname',
                  testName: testName,
                  imagingType: imagingType,
                  collection: collectionName,
                  billId: request.billId || null,
                  patientName: request['Patient Name'] || null,
                  testCode: billInfo.TestDetails?.TestCode || billInfo.testCode || null,
                  testAmount: billInfo.testAmount || null,
                  department: billInfo.TestDetails?.Department || request.departmentName || null,
                  createdAt: doc.createdAt || null
                });
              }
            }
          }
        }
        
        // Check labReportDetails
        if (request.labReportDetails && Array.isArray(request.labReportDetails)) {
          for (const report of request.labReportDetails) {
            const testName = report.reportID?.testName || report.reportID?.testname;
            if (testName && containsImagingTerm(testName)) {
              const imagingType = getImagingType(testName);
              // Avoid duplicates
              const isDuplicate = results.some(r => 
                r.testName === testName && 
                r.billId === (request.billId || null) &&
                r.labReportId === (report.labReportId || null) &&
                r.collection === collectionName
              );
              if (!isDuplicate) {
                results.push({
                  _id: doc._id,
                  field: 'labReportDetails.reportID.testName',
                  testName: testName,
                  imagingType: imagingType,
                  collection: collectionName,
                  billId: request.billId || null,
                  patientName: request['Patient Name'] || null,
                  testCode: report.reportID?.testCode || null,
                  testAmount: report.reportID?.testAmount || null,
                  department: report.reportID?.departmentId?.name || null,
                  labReportId: report.labReportId || null,
                  createdAt: doc.createdAt || null
                });
              }
            }
          }
        }
      }
      
    }
    
    console.log(`   Found ${results.length} matching records`);
    return results;
  } catch (error) {
    console.error(`   Error searching ${collectionName}:`, error.message);
    return [];
  }
}

/**
 * Helper to get nested value from object
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  return value;
}

/**
 * Export results to CSV file
 */
function exportToCSV(results, filePath) {
  if (results.length === 0) {
    console.log('   No data to export');
    return;
  }
  
  // CSV Headers
  const headers = [
    'Test Name',
    'Imaging Type',
    'Collection',
    'Bill ID',
    'Patient Name',
    'Test Code',
    'Test Amount',
    'Department',
    'Lab Report ID',
    'Field Location',
    'Record ID',
    'Created At'
  ];
  
  // Convert results to CSV rows
  const rows = results.map(r => {
    return [
      escapeCSV(r.testName || ''),
      escapeCSV(r.imagingType || 'Unknown'),
      escapeCSV(r.collection || ''),
      escapeCSV(r.billId ? String(r.billId) : ''),
      escapeCSV(r.patientName || ''),
      escapeCSV(r.testCode || ''),
      escapeCSV(r.testAmount ? String(r.testAmount) : ''),
      escapeCSV(r.department || ''),
      escapeCSV(r.labReportId ? String(r.labReportId) : ''),
      escapeCSV(r.field || ''),
      escapeCSV(r._id ? String(r._id) : ''),
      escapeCSV(r.createdAt ? new Date(r.createdAt).toISOString() : '')
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Write to file
  try {
    fs.writeFileSync(filePath, csvContent, 'utf8');
    console.log(`   ✅ CSV file created with ${results.length} records`);
  } catch (error) {
    console.error(`   ❌ Error writing CSV file:`, error.message);
  }
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Main function
 */
async function checkCTScanMRI() {
  try {
    console.log("🔍 Starting Imaging/Scan Tests data check...\n");
    console.log("📋 Searching for: CT Scan, MRI, Ultrasound, X-Ray, PET Scan, and other imaging tests\n");
    
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database\n");
    
    const allResults = [];
    
    // Search in RequestDump
    const requestDumpResults = await searchInCollection(
      RequestDump,
      "RequestDump",
      ['request.billInfoDetails', 'request.labReportDetails']
    );
    allResults.push(...requestDumpResults);
    
    // Search in SampleStatusTracker
    const sampleResults = await searchInCollection(
      SampleStatusTracker,
      "SampleStatusTracker",
      ['request.testName', 'request.TestDetails.TestName']
    );
    allResults.push(...sampleResults);
    
    // Search in ReportStatusTracker
    const reportStatusResults = await searchInCollection(
      ReportStatusTracker,
      "ReportStatusTracker",
      ['request.reportDetails', 'request.testName']
    );
    allResults.push(...reportStatusResults);
    
    // Search in Report
    const reportResults = await searchInCollection(
      Report,
      "Report",
      ['status']
    );
    allResults.push(...reportResults);
    
    // Search in Patient (consolidated)
    const patientResults = await searchInCollection(
      Patient,
      "Patient",
      ['testName', 'departmentName']
    );
    allResults.push(...patientResults);
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    
    if (allResults.length === 0) {
      console.log("\n❌ No imaging/scan test records found in the database.");
      console.log("\n💡 This could mean:");
      console.log("   1. No imaging tests have been performed yet");
      console.log("   2. The test names use different terminology");
      console.log("   3. The data is stored in a different format");
    } else {
      console.log(`\n✅ Found ${allResults.length} records containing imaging/scan test data:\n`);
      
      // Group by collection
      const byCollection = {};
      for (const result of allResults) {
        if (!byCollection[result.collection]) {
          byCollection[result.collection] = [];
        }
        byCollection[result.collection].push(result);
      }
      
      // Filter valid results (with test names)
      const validResults = allResults.filter(r => r.testName && r.testName !== 'undefined' && r.testName !== 'null' && typeof r.testName === 'string');
      
      // Display results by collection (only valid ones)
      const validByCollection = {};
      for (const result of validResults) {
        if (!validByCollection[result.collection]) {
          validByCollection[result.collection] = [];
        }
        validByCollection[result.collection].push(result);
      }
      
      for (const [collection, results] of Object.entries(validByCollection)) {
        console.log(`\n📁 ${collection} (${results.length} records):`);
        results.slice(0, 5).forEach((result, idx) => {
          console.log(`   ${idx + 1}. Test: ${result.testName}`);
          console.log(`      Type: ${result.imagingType}`);
          console.log(`      ID: ${result._id}`);
        });
        if (results.length > 5) {
          console.log(`   ... and ${results.length - 5} more`);
        }
      }
      
      // Count by imaging type
      const imagingTypeCounts = {};
      validResults.forEach(r => {
        const type = r.imagingType || 'Unknown';
        imagingTypeCounts[type] = (imagingTypeCounts[type] || 0) + 1;
      });
      
      console.log(`\n📈 Breakdown by Imaging Type (${validResults.length} valid records):`);
      Object.entries(imagingTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count} records`);
        });
      
      // Show unique test names (filter out undefined/null)
      const uniqueTestNames = [...new Set(allResults
        .map(r => r.testName)
        .filter(name => name && name !== 'undefined' && name !== 'null' && typeof name === 'string')
      )];
      console.log(`\n📝 Unique Test Names Found (${uniqueTestNames.length}):`);
      uniqueTestNames.slice(0, 20).forEach((name, idx) => {
        const displayName = name && typeof name === 'string' ? name.substring(0, 80) : String(name || 'N/A');
        console.log(`   ${idx + 1}. ${displayName}`);
      });
      if (uniqueTestNames.length > 20) {
        console.log(`   ... and ${uniqueTestNames.length - 20} more`);
      }
      
      // Export to CSV (only valid results)
      const csvPath = path.join(__dirname, 'imaging_tests_report.csv');
      exportToCSV(validResults, csvPath);
      console.log(`\n💾 Results exported to: ${csvPath}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Check completed!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error checking for imaging/scan test data:", error);
    throw error;
  } finally {
    // Disconnect from database
    await disconnectDB();
    process.exit(0);
  }
}

// Run the check
checkCTScanMRI();
