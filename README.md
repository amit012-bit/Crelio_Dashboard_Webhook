# Crelio Dashboard Webhook Application

A full-stack dashboard application that receives webhook data from the Crelio webhook receiver and displays it in a beautiful, real-time dashboard. Built with MERN stack (MongoDB, Express, React, Node.js) and Next.js.

## 🎯 Features

- **Webhook Integration**: Receives data from Node.js-Webhook-on-Render service
- **Real-time Dashboard**: Beautiful, animated dashboard showing:
  - Daily patient statistics
  - Patient status tracking
  - Doctor information
  - Lab reports
  - Activity charts
  - Success statistics by specialty
- **Database-Driven**: All data stored in MongoDB Atlas
- **Modular Architecture**: Clean separation of concerns
- **Responsive Design**: Works on all devices
- **Animated UI**: Smooth animations using Framer Motion

## 📁 Project Structure

```
Crelio-Dashboard-Webhook/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB models (Patient, Doctor, Report, Lab)
│   ├── routes/             # API routes
│   ├── middleware/         # Error handling, async handlers
│   ├── server.js           # Express server entry point
│   └── package.json
├── frontend/                # Next.js + React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Next.js pages
│   ├── lib/                # API client and utilities
│   ├── styles/             # Global styles
│   └── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- The Node.js-Webhook-on-Render service running

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Update with your MongoDB connection string:
# MONGODB_URI=mongodb+srv://amitprakhar14_db_user:3rtQwcXI3eMo07aa@cluster0.xxxxx.mongodb.net/crelio_dashboard?retryWrites=true&w=majority

# Start development server
npm run dev

# Or start production server
npm start
```

**Backend Environment Variables (.env):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://amitprakhar14_db_user:3rtQwcXI3eMo07aa@cluster0.xxxxx.mongodb.net/crelio_dashboard?retryWrites=true&w=majority
WEBHOOK_SECRET=my-secret-token
FRONTEND_URL=http://localhost:3000
```

**Important**: Replace `cluster0.xxxxx` with your actual MongoDB Atlas cluster URL.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file (optional)
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. MongoDB Atlas Connection

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string from the "Connect" button
3. Replace the username and password:
   - Username: `amitprakhar14_db_user`
   - Password: `3rtQwcXI3eMo07aa`
4. Update the cluster URL in your `.env` file

**Connection String Format:**
```
mongodb+srv://amitprakhar14_db_user:3rtQwcXI3eMo07aa@cluster0.xxxxx.mongodb.net/crelio_dashboard?retryWrites=true&w=majority
```

### 4. Connect Webhook Receiver

Update your `Node.js-Webhook-on-Render` service to send data to this dashboard:

```javascript
// After processing webhook, send to dashboard
const dashboardResponse = await fetch('http://localhost:5000/api/webhook/crelio', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Token': 'my-secret-token'
  },
  body: JSON.stringify(payload)
});
```

## 📊 Database Models

### Patient
- Basic information (name, age, gender, contact)
- Status tracking (Registered, Lab Test Scheduled, Report Generated, etc.)
- Relationships (assigned doctor, lab reports)
- Webhook metadata

### Doctor
- Professional information (name, specialty, qualifications)
- Status (Active, On Leave, Inactive)
- Patient assignments

### Report
- Report identification (reportId, billId, testId)
- PDF data (base64, file path)
- Patient and doctor relationships
- Status and workflow information

### Lab
- Lab information and capabilities
- Contact details
- Status

## 🔌 API Endpoints

### Webhook Endpoint
- **POST** `/api/webhook/crelio` - Receive webhook data

### Dashboard Endpoints
- **GET** `/api/dashboard/stats` - Get dashboard statistics
- **GET** `/api/dashboard/patients/today` - Get today's patients
- **GET** `/api/dashboard/patients/status/:status` - Get patients by status
- **GET** `/api/dashboard/patients` - Get all patients (paginated)
- **GET** `/api/dashboard/patients/:id` - Get patient by ID
- **GET** `/api/dashboard/doctors` - Get all doctors
- **GET** `/api/dashboard/reports/recent` - Get recent reports
- **GET** `/api/dashboard/activity` - Get activity chart data
- **GET** `/api/dashboard/success-stats` - Get success statistics

## 🎨 Frontend Features

- **Dashboard Page**: Main dashboard with statistics and charts
- **Responsive Layout**: Sidebar navigation and top navbar
- **Animated Components**: Smooth transitions using Framer Motion
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Charts**: Activity trends and success statistics
- **Patient Table**: Recent patients with status and actions
- **Doctor List**: Active doctors with specialties

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Next.js development server
```

### Build for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `WEBHOOK_SECRET` - Secret token for webhook authentication
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5000)

## 🔒 Security

- Webhook token authentication
- CORS enabled for frontend
- Environment variables for sensitive data
- Input validation and error handling

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your connection string is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure username and password are correct

### Webhook Not Receiving Data
- Check if webhook token matches in both services
- Verify backend is running on correct port
- Check CORS settings

### Frontend Not Loading Data
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` in frontend
- Check browser console for errors

## 📚 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- CORS

### Frontend
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Framer Motion
- Recharts
- Axios

## 🤝 Contributing

1. Follow the modular architecture
2. Add comments to all functions
3. Use TypeScript for type safety
4. Follow existing code patterns
5. Test before submitting

## 📄 License

MIT

## 🎉 Getting Started

1. Set up backend and frontend as described above
2. Configure MongoDB connection
3. Start both servers
4. Send a test webhook from Node.js-Webhook-on-Render
5. View data in the dashboard at `http://localhost:3000`

---

**Note**: Make sure both the webhook receiver and this dashboard are running for the complete flow to work!

# Crelio_Dashboard_Webhook
