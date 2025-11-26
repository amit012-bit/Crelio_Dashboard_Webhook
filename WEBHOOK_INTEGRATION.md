# Webhook Integration Guide

## Overview

The Crelio Dashboard Webhook system receives data from external webhook calls (like from Node.js-Webhook-on-Render) and automatically saves it to the MongoDB database. When a webhook is hit, it:

1. ✅ Validates the webhook token
2. ✅ Extracts data from the payload (handles flexible payload structures)
3. ✅ Saves/updates Patient data in the database
4. ✅ Creates/updates Report data in the database
5. ✅ Creates/finds Doctor data if provided
6. ✅ Sends email alert notification
7. ✅ Returns success response

## Webhook Endpoints

The system supports multiple webhook endpoints for compatibility:

### Primary Endpoint
- **URL**: `POST /api/webhook/crelio`
- **Headers**: `X-Webhook-Token: <your-webhook-secret>`
- **Body**: JSON payload with webhook data

### Alternative Endpoints (for compatibility)
- **URL**: `POST /crelio/webhook` (matches original Node.js-Webhook-on-Render format)
- **URL**: `POST /api/webhook/crelio/webhook`

All endpoints use the same handler and authentication.

## Authentication

All webhook endpoints require authentication via the `X-Webhook-Token` header:

```bash
X-Webhook-Token: your-webhook-secret-from-env
```

The token must match the `WEBHOOK_SECRET` value in your `.env` file.

## Payload Structure

The webhook handler is flexible and can handle various payload structures. It automatically searches for common field names (case-insensitive):

### Required Fields
- `reportId` (or `CentreReportId`, `report_id`, etc.) - Report identifier

### Optional Fields
- `reportBase64` (or `pdfBase64`, `base64`, etc.) - Base64 encoded PDF
- `billId` (or `bill_id`, `billNumber`, etc.) - Bill identifier
- `testId` (or `test_id`, `testNumber`, etc.) - Test identifier
- `patientName` (or `name`, `patient_name`, etc.) - Patient name
- `patientAge` (or `age`) - Patient age
- `patientGender` (or `gender`, `sex`) - Patient gender
- `patientPhone` (or `phone`, `contactNumber`) - Patient phone
- `patientEmail` (or `email`, `emailAddress`) - Patient email
- `doctorName` (or `doctor_name`, `physicianName`) - Doctor name
- `doctorSpecialty` (or `specialty`, `specialization`) - Doctor specialty
- `testName` (or `test_name`, `testType`) - Test name
- `testCategory` (or `category`, `test_category`) - Test category

## Example Webhook Request

```bash
curl -X POST http://localhost:5000/api/webhook/crelio \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-webhook-secret" \
  -d '{
    "CentreReportId": "RPT-12345",
    "reportBase64": "JVBERi0xLjQKJeLjz9MKMy...",
    "billId": "BILL-001",
    "testId": "TEST-001",
    "patientName": "John Doe",
    "patientAge": 35,
    "patientGender": "Male",
    "doctorName": "Dr. Smith",
    "doctorSpecialty": "Cardiologist"
  }'
```

## What Happens When Webhook is Hit

1. **Token Validation**: Checks if `X-Webhook-Token` header matches `WEBHOOK_SECRET`

2. **Data Extraction**: Programmatically extracts fields from payload (handles different field name variations)

3. **Patient Creation/Update**:
   - Creates new patient if doesn't exist
   - Updates existing patient if found (by reportId or billId)
   - Sets status to "Report Generated"

4. **Doctor Creation/Find**:
   - Finds existing doctor by name (case-insensitive)
   - Creates new doctor if not found
   - Assigns doctor to patient

5. **Report Creation/Update**:
   - Creates new report with Base64 PDF data
   - Updates existing report if found
   - Links report to patient and doctor

6. **Email Alert**:
   - Sends email notification to `RECIPIENT_EMAIL`
   - Includes patient, report, and webhook details
   - Runs asynchronously (doesn't block response)

7. **Response**: Returns JSON with created/updated data

## Email Configuration

Email alerts are sent when webhooks are received. Configure in `.env`:

```env
# Email Configuration (for Mailtrap testing)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=webhook@crelio-dashboard.local
```

### For Production (Gmail)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=your-email@gmail.com
```

**Note**: For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password (not your regular password)
3. Use the App Password in `EMAIL_PASSWORD`

## Database Models Updated

When a webhook is received, the following models are updated:

- **Patient**: Created/updated with patient information
- **Report**: Created/updated with report data and Base64 PDF
- **Doctor**: Created/found and linked to patient
- **Lab**: Can be linked if lab information is provided

## Testing the Webhook

### Using cURL
```bash
curl -X POST http://localhost:5000/api/webhook/crelio \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-webhook-secret" \
  -d '{
    "CentreReportId": "TEST-001",
    "reportBase64": "JVBERi0xLjQK...",
    "patientName": "Test Patient",
    "patientAge": 30
  }'
```

### Using Postman
1. Method: `POST`
2. URL: `http://localhost:5000/api/webhook/crelio`
3. Headers:
   - `Content-Type: application/json`
   - `X-Webhook-Token: your-webhook-secret`
4. Body (raw JSON):
```json
{
  "CentreReportId": "TEST-001",
  "reportBase64": "JVBERi0xLjQK...",
  "patientName": "Test Patient"
}
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "patient": {
      "id": "...",
      "patientId": "PAT-12345",
      "name": "John Doe",
      "status": "Report Generated"
    },
    "report": {
      "id": "...",
      "reportId": "RPT-12345",
      "status": "Report Generated"
    },
    "doctor": {
      "id": "...",
      "name": "Dr. Smith",
      "specialty": "Cardiologist"
    }
  }
}
```

### Error Responses

**401 Unauthorized** (Invalid token):
```json
{
  "success": false,
  "error": "Invalid webhook token"
}
```

**400 Bad Request** (Missing required fields):
```json
{
  "success": false,
  "error": "Missing required field: reportId (or CentreReportId)",
  "receivedFields": ["field1", "field2"]
}
```

## Integration with Node.js-Webhook-on-Render

This webhook system is designed to work with the Node.js-Webhook-on-Render service. When that service receives a webhook from Crelio, it can forward the data to this dashboard's webhook endpoint.

### Setup Flow:
1. Node.js-Webhook-on-Render receives webhook from Crelio
2. Node.js-Webhook-on-Render processes and saves PDF locally
3. Node.js-Webhook-on-Render forwards data to Crelio-Dashboard-Webhook
4. Crelio-Dashboard-Webhook saves data to MongoDB
5. Dashboard displays the data in real-time

## Environment Variables Required

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Webhook Security
WEBHOOK_SECRET=your-secret-token

# Email (Optional - for alerts)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=webhook@crelio-dashboard.local

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Monitoring

Check webhook activity in:
- **Server logs**: Console output shows webhook processing
- **Database**: Check Patient, Report, and Doctor collections
- **Email inbox**: Receive alerts for each webhook
- **Dashboard**: View data in real-time on the frontend

## Troubleshooting

### Webhook not saving data
- Check `WEBHOOK_SECRET` matches in request header
- Verify MongoDB connection is working
- Check server logs for errors

### Email not sending
- Verify email credentials in `.env`
- Check SMTP settings (host, port, secure)
- For Gmail, ensure App Password is used (not regular password)
- Email failures don't block webhook processing

### Data not appearing in dashboard
- Verify data was saved to database
- Check frontend API calls are working
- Refresh dashboard to see new data

