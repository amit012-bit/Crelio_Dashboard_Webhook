import axios from "axios";
import { API_URL } from "./config";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor (for adding auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error:", error.message);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Dashboard API Functions
 */

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats
 */
export const getDashboardStats = async () => {
  const response = await apiClient.get("/dashboard/stats");
  return response.data;
};

/**
 * Get today's patients
 * @returns {Promise<Array>} List of patients registered today
 */
export const getTodayPatients = async () => {
  const response = await apiClient.get("/dashboard/patients/today");
  return response.data;
};

/**
 * Get patients by status
 * @param {string} status - Patient status
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated patients
 */
export const getPatientsByStatus = async (status, page = 1, limit = 20) => {
  const response = await apiClient.get(`/dashboard/patients/status/${status}`, {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Get all patients with pagination and search
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Paginated patients
 */
export const getAllPatients = async (params = {}) => {
  const response = await apiClient.get("/dashboard/patients", { params });
  return response.data;
};

/**
 * Get patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise<Object>} Patient details
 */
export const getPatientById = async (id) => {
  const response = await apiClient.get(`/dashboard/patients/${id}`);
  return response.data;
};

/**
 * Get all doctors
 * @param {Object} params - Query parameters (status, specialty)
 * @returns {Promise<Array>} List of doctors
 */
export const getAllDoctors = async (params = {}) => {
  const response = await apiClient.get("/dashboard/doctors", { params });
  return response.data;
};

/**
 * Get recent reports
 * @param {number} limit - Number of reports to fetch
 * @returns {Promise<Array>} List of recent reports
 */
export const getRecentReports = async (limit = 10) => {
  const response = await apiClient.get("/dashboard/reports/recent", {
    params: { limit },
  });
  return response.data;
};

/**
 * Get activity chart data
 * @param {number} months - Number of months of data
 * @returns {Promise<Array>} Activity data for chart
 */
export const getActivityData = async (months = 6) => {
  const response = await apiClient.get("/dashboard/activity", {
    params: { months },
  });
  return response.data;
};

/**
 * Get success stats by specialty
 * @returns {Promise<Array>} Success statistics
 */
export const getSuccessStats = async () => {
  const response = await apiClient.get("/dashboard/success-stats");
  return response.data;
};

export const getPatientBillById = async (id) => {
  const response = await apiClient.get(`/dashboard/patients/bill?id=${id}`);
  return response.data;
};

export const getPatientTests = async (id) => {
  const response = await apiClient.get(`/dashboard/patients/tests?id=${id}`);
  return response.data;
};

export const getPatientReports = async (id) => {
  const response = await apiClient.get(`/dashboard/patients/reports?id=${id}`);
  return response.data;
};

export const getPatientReportStatus = async (id) => {
  const response = await apiClient.get(`/dashboard/patients/report-status?id=${id}`);
  return response.data;
};

export default apiClient;

