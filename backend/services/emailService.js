/**
 * Email Service Module
 * 
 * This module handles sending email notifications when webhooks are received.
 * It uses nodemailer to send emails via SMTP (supports Mailtrap, Gmail, Outlook, etc.)
 * 
 * Features:
 * - Sends email alerts on webhook receipt
 * - Includes all webhook payload information
 * - Handles email sending errors gracefully
 * - Configurable via environment variables
 * - Default: Mailtrap Sandbox (for testing - emails captured, not sent)
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Email configuration from environment variables
// Default: Mailtrap Sandbox (for testing - emails are captured, not sent)
// For production: Use Gmail, Outlook, or other SMTP providers
const EMAIL_CONFIG = {
  // SMTP server host
  // Mailtrap Sandbox: sandbox.smtp.mailtrap.io (for testing)
  // Gmail: smtp.gmail.com, Outlook: smtp-mail.outlook.com
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  // SMTP port (Mailtrap: 2525, Gmail: 587, Outlook: 587)
  port: parseInt(process.env.SMTP_PORT || "2525"),
  // Use secure connection (true for 465, false for other ports)
  secure: process.env.SMTP_SECURE === "true" || false,
  // Authentication credentials
  auth: {
    // Mailtrap username (or email for other providers)
    // Get your credentials from: https://mailtrap.io/inboxes
    user: process.env.EMAIL_USER || "",
    // Mailtrap password (or app password for other providers)
    // Get your credentials from: https://mailtrap.io/inboxes
    pass: process.env.EMAIL_PASSWORD || "",
  },
};

// Recipient email address (where alerts will be sent)
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || "sharktankindia1122@gmail.com";

// Create reusable transporter object using the default SMTP transport
// This is created once and reused for all emails
let transporter = null;

/**
 * Initialize the email transporter
 * This sets up the connection to the SMTP server
 */
function initializeTransporter() {
  // Check if credentials are provided
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn("⚠️  Email credentials not configured!");
    console.warn("   For Mailtrap: Set EMAIL_USER and EMAIL_PASSWORD in .env file");
    console.warn("   Get credentials from: https://mailtrap.io/inboxes");
    return null;
  }

  // Create transporter if not already created
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
    });
    
    // Log which SMTP server is being used
    if (EMAIL_CONFIG.host.includes("mailtrap")) {
      console.log("📧 Using Mailtrap Sandbox (emails will be captured for testing)");
      console.log("📧 View emails at: https://mailtrap.io/inboxes");
    } else {
      console.log(`📧 Using SMTP: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
    }
  }

  return transporter;
}

/**
 * Send email notification when webhook is received
 * 
 * @param {Object} webhookData - The webhook payload and extracted fields
 * @param {string} webhookData.reportId - Report ID from the payload
 * @param {string} webhookData.billId - Bill ID from the payload (optional)
 * @param {string} webhookData.testId - Test ID from the payload (optional)
 * @param {string} webhookData.patientName - Patient name (optional)
 * @param {Object} webhookData.patient - Patient document (optional)
 * @param {Object} webhookData.report - Report document (optional)
 * @param {Object} webhookData.payload - Full webhook payload (for reference)
 * @returns {Promise<Object>} - Email sending result
 */
export async function sendWebhookAlert(webhookData) {
  try {
    // Initialize transporter
    const emailTransporter = initializeTransporter();
    
    // If email is not configured, skip sending (don't throw error)
    if (!emailTransporter) {
      console.log("📧 Email not configured, skipping email notification");
      return { success: false, message: "Email not configured" };
    }

    // Extract data from webhookData
    const { reportId, billId, testId, patientName, patient, report, payload } = webhookData;

    // Create email subject with report ID
    const subject = `🔔 Crelio Webhook Alert - Report ID: ${reportId || "Unknown"}`;

    // Create email body with all webhook information
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .field { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid #4CAF50; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; margin-top: 5px; }
    .footer { margin-top: 20px; padding: 10px; text-align: center; color: #777; font-size: 12px; }
    .timestamp { color: #666; font-size: 14px; }
    .success { color: #4CAF50; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 New Crelio Webhook Received</h2>
    </div>
    <div class="content">
      <p class="timestamp">📅 Received at: ${new Date().toLocaleString()}</p>
      <p class="success">✅ Data saved to database successfully!</p>
      
      <div class="field">
        <div class="label">📄 Report ID:</div>
        <div class="value">${reportId || "Not provided"}</div>
      </div>
      
      ${billId ? `
      <div class="field">
        <div class="label">🧾 Bill ID:</div>
        <div class="value">${billId}</div>
      </div>
      ` : ""}
      
      ${testId ? `
      <div class="field">
        <div class="label">🧪 Test ID:</div>
        <div class="value">${testId}</div>
      </div>
      ` : ""}
      
      ${patientName ? `
      <div class="field">
        <div class="label">👤 Patient Name:</div>
        <div class="value">${patientName}</div>
      </div>
      ` : ""}
      
      ${patient ? `
      <div class="field">
        <div class="label">👤 Patient Details:</div>
        <div class="value">
          ID: ${patient.patientId || patient._id}<br>
          Name: ${patient.name || "N/A"}<br>
          Status: ${patient.status || "N/A"}<br>
          Age: ${patient.age || "N/A"}<br>
          Gender: ${patient.gender || "N/A"}
        </div>
      </div>
      ` : ""}
      
      ${report ? `
      <div class="field">
        <div class="label">📋 Report Details:</div>
        <div class="value">
          Report ID: ${report.reportId || "N/A"}<br>
          Status: ${report.status || "N/A"}<br>
          Test Name: ${report.testName || "N/A"}<br>
          Generated: ${report.reportGeneratedDate ? new Date(report.reportGeneratedDate).toLocaleString() : "N/A"}
        </div>
      </div>
      ` : ""}
      
      <div class="field">
        <div class="label">📦 Payload Fields Received:</div>
        <div class="value">${payload ? Object.keys(payload).join(", ") : "None"}</div>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from the Crelio Dashboard Webhook Receiver.</p>
        <p>Webhook processed and saved to database at ${new Date().toISOString()}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version (fallback for email clients that don't support HTML)
    const textBody = `
🔔 New Crelio Webhook Received

📅 Received at: ${new Date().toLocaleString()}
✅ Data saved to database successfully!

📄 Report ID: ${reportId || "Not provided"}
${billId ? `🧾 Bill ID: ${billId}` : ""}
${testId ? `🧪 Test ID: ${testId}` : ""}
${patientName ? `👤 Patient Name: ${patientName}` : ""}
${patient ? `👤 Patient: ${patient.name || "N/A"} (${patient.patientId || patient._id})` : ""}
${report ? `📋 Report: ${report.reportId || "N/A"} - ${report.status || "N/A"}` : ""}
📦 Payload Fields: ${payload ? Object.keys(payload).join(", ") : "None"}

This is an automated notification from the Crelio Dashboard Webhook Receiver.
Webhook processed and saved to database successfully.
    `.trim();

    // Define email options
    // For Mailtrap: any email address works (emails are captured, not sent)
    // For production: use a real email address
    const fromEmail = process.env.EMAIL_FROM || `webhook@crelio-dashboard.local`;
    
    const mailOptions = {
      // Sender email (for Mailtrap, any address works)
      from: `"Crelio Dashboard Webhook" <${fromEmail}>`,
      // Recipient email
      to: RECIPIENT_EMAIL,
      // Email subject
      subject: subject,
      // Plain text version
      text: textBody,
      // HTML version
      html: emailBody,
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);

    // Log success
    console.log("📧 Email sent successfully:", info.messageId);
    console.log("📧 Email sent to:", RECIPIENT_EMAIL);

    // Return success result
    return {
      success: true,
      messageId: info.messageId,
      recipient: RECIPIENT_EMAIL,
    };
  } catch (error) {
    // Log error but don't throw (don't break webhook processing if email fails)
    console.error("❌ Error sending email:", error.message);
    console.error("Email error details:", error);

    // Return error result
    return {
      success: false,
      error: error.message,
    };
  }
}

