import axios from 'axios';

// Base URL for the Flask backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep for any remaining cookie-based endpoints
});

// Function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Request interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

  // Authentication - JWT based
  login: async (credentials) => {
    const response = await apiClient.post('/api/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/logout');
    // Clear local storage on logout
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    return response.data;
  },

  checkAuthStatus: async () => {
    const response = await apiClient.get('/api/auth/status');
    return response.data;
  },

  // Legacy admin methods (for backward compatibility)
  adminLogin: async (credentials) => {
    return this.login(credentials);
  },

  adminLogout: async () => {
    return this.logout();
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

  // Bulk CSV upload
  bulkUploadCertificates: async (csvFile) => {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    
    const response = await apiClient.post('/api/certificates/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Bulk approve processed files
  bulkApproveCertificates: async (items) => {
    const response = await apiClient.post('/api/certificates/bulk-approve', { items });
    return response.data;
  },

  // Download CSV template
  downloadCsvTemplate: async () => {
    const response = await apiClient.get('/api/certificates/csv-template', {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'certificate_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Template downloaded successfully' };
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

  // Fraud Detection APIs
  getFraudLogs: async (page = 1, perPage = 20, statusFilter = '', dateFrom = '', dateTo = '') => {
    let params = `page=${page}&per_page=${perPage}`;
    if (statusFilter) params += `&status=${statusFilter}`;
    if (dateFrom) params += `&date_from=${dateFrom}`;
    if (dateTo) params += `&date_to=${dateTo}`;
    
    const response = await apiClient.get(`/api/fraud-logs?${params}`);
    return response.data;
  },

  updateFraudLog: async (fraudId, updateData) => {
    const response = await apiClient.put(`/api/fraud-logs/${fraudId}`, updateData);
    return response.data;
  },

  getFraudStats: async () => {
    const response = await apiClient.get('/api/fraud-logs/stats');
    return response.data;
  },

  exportFraudLogs: async (statusFilter = '', dateFrom = '', dateTo = '') => {
    let params = '';
    if (statusFilter) params += `status=${statusFilter}&`;
    if (dateFrom) params += `date_from=${dateFrom}&`;
    if (dateTo) params += `date_to=${dateTo}&`;
    
    const response = await apiClient.get(`/api/fraud-logs/export?${params}`, {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : `fraud_detection_logs_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Fraud logs exported successfully' };
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
        // Unauthorized - handle JWT token expiry or invalid credentials
        const errorMessage = data?.error || 'Unauthorized access';
        
        if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
          // Token expired or invalid - clear storage and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          
          // Redirect to login if we're not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        throw new Error(errorMessage);
      } else if (status === 403) {
        // Forbidden - insufficient privileges
        throw new Error(data?.error || 'Insufficient privileges for this action');
      } else if (status === 413) {
        // File too large
        throw new Error('File too large. Maximum size is 16MB.');
      } else if (status >= 500) {
        // Server error
        throw new Error('Server error. Please try again later.');
      } else {
        // Other client errors
        throw new Error(data?.error || 'An error occurred');
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