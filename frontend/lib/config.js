// Backend API URL
// Production: Your deployed backend URL
// Development: Local backend URL
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  // 'https://crelio-dashboard-webhook.onrender.com';
  'http://localhost:5000';

// Alternative: Use localhost for development
// Uncomment the line below and comment the one above for local development
// export const API_URL = 'http://localhost:5000';

// Webhook endpoint (if needed for frontend)
export const WEBHOOK_URL = `${API_URL}/api/webhook/crelio`;

// Dashboard API base URL
export const DASHBOARD_API_URL = `${API_URL}/api/dashboard`;

// Export default config object
const config = {
  API_URL,
  WEBHOOK_URL,
  DASHBOARD_API_URL,
};

export default config;

