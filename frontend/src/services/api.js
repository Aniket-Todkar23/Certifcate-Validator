import axios from 'axios';

// Base URL for the Flask backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session-based auth
});

// API service functions
export const apiService = {
  // Certificate verification
  verifyCertificate: async (file) => {
    const formData = new FormData();
    formData.append('certificate', file);
    
    const response = await apiClient.post('/api/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

    // Authentication
  checkAuthStatus: async () => {
    const response = await apiClient.get('/api/auth/status');
    return response.data;
  },

  // Admin login
  adminLogin: async (credentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await apiClient.post('/admin/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  adminLogout: async () => {
    const response = await apiClient.get('/admin/logout');
    return response.data;
  },

  // Statistics and dashboard data
  getStats: async (days = 30) => {
    const response = await apiClient.get(`/api/stats?days=${days}`);
    return response.data;
  },

  getVerificationHistory: async (page = 1, perPage = 20) => {
    const response = await apiClient.get(`/api/verification-history?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Certificate management
  addCertificate: async (certificateData) => {
    const response = await apiClient.post('/api/certificates', certificateData);
    return response.data;
  },

  getCertificateDetails: async (certificateId) => {
    const response = await apiClient.get(`/api/certificate/${certificateId}`);
    return response.data;
  },

  // OCR extraction
  extractOCR: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/ocr-extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Institution management
  getInstitutions: async () => {
    const response = await apiClient.get('/api/institutions');
    return response.data;
  },

  addInstitution: async (institutionData) => {
    const response = await apiClient.post('/api/institutions', institutionData);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login or handle auth error
        console.warn('Unauthorized access');
      } else if (status === 413) {
        // File too large
        throw new Error('File too large. Maximum size is 16MB.');
      } else if (status >= 500) {
        // Server error
        throw new Error('Server error. Please try again later.');
      } else {
        // Other client errors
        throw new Error(data.error || 'An error occurred');
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request
      throw new Error('Request failed. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default apiService;