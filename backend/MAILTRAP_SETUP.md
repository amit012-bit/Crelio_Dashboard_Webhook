# Mailtrap Email Setup Guide

## Quick Setup

Add these lines to your `backend/.env` file:

```env
# Email Configuration (Mailtrap for testing)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=webhook@crelio-dashboard.local
```

## Step-by-Step Instructions

### 1. Get Mailtrap Credentials

1. Go to https://mailtrap.io/
2. Sign up for a free account (if you don't have one)
3. Go to **Inboxes** → Select your inbox
4. Click on **SMTP Settings** tab
5. Select **Node.js - Nodemailer** integration
6. Copy the following values:
   - **Host**: `sandbox.smtp.mailtrap.io`
   - **Port**: `2525`
   - **Username**: (your Mailtrap username)
   - **Password**: (your Mailtrap password)

### 2. Update Your .env File

Open `backend/.env` and add the email configuration:

```env
# Email Configuration (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=04b4c8f512a145
EMAIL_PASSWORD=a44a0b4d5a5841
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=webhook@crelio-dashboard.local
```

**Replace:**
- `EMAIL_USER` with your Mailtrap username
- `EMAIL_PASSWORD` with your Mailtrap password

### 3. Restart Your Server

After updating `.env`, restart your backend server:

```bash
cd backend
npm run dev
```

### 4. Test Email Configuration

When the server starts, you should see:

```
📧 Using Mailtrap Sandbox (emails will be captured for testing)
📧 View emails at: https://mailtrap.io/inboxes
```

### 5. View Emails

1. Go to https://mailtrap.io/inboxes
2. Select your inbox
3. All webhook email alerts will appear here
4. Emails are captured (not actually sent) - perfect for testing!

## Example .env File

Here's a complete example of what your `backend/.env` should look like:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Webhook Security
WEBHOOK_SECRET=my-secret-token

# Email Configuration (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
RECIPIENT_EMAIL=sharktankindia1122@gmail.com
EMAIL_FROM=webhook@crelio-dashboard.local

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Email not sending?

1. **Check credentials**: Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are correct
2. **Check server logs**: Look for email-related error messages
3. **Verify Mailtrap inbox**: Make sure you're checking the correct inbox
4. **Restart server**: After changing `.env`, always restart the server

### Still not working?

- Verify your Mailtrap credentials at https://mailtrap.io/inboxes
- Check that SMTP settings match exactly (host, port, secure)
- Make sure there are no extra spaces in your `.env` file
- Check server console for detailed error messages

## Production Setup

For production, replace Mailtrap with a real SMTP provider (Gmail, Outlook, etc.):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note**: For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an App Password (not your regular password)
3. Use the App Password in `EMAIL_PASSWORD`

