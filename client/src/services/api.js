import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );

          if (response.data.success) {
            // Retry original request with new token
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, redirect to login
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show toast for authentication endpoints to avoid duplicate messages
    if (!originalRequest.url?.includes('/auth/')) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, passwords) => api.post(`/auth/reset-password/${token}`, passwords),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`)
};

// Student API endpoints
export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.put('/students/profile', data),
  getAttendance: (params) => api.get('/students/attendance', { params }),
  getGrades: (params) => api.get('/students/grades', { params }),
  getFees: (params) => api.get('/students/fees', { params }),
  getCourses: () => api.get('/students/courses'),
  getLibraryHistory: () => api.get('/students/library-history')
};

// Faculty API endpoints
export const facultyAPI = {
  getProfile: () => api.get('/faculty/profile'),
  updateProfile: (data) => api.put('/faculty/profile', data),
  getClasses: () => api.get('/faculty/classes'),
  markAttendance: (data) => api.post('/faculty/attendance', data),
  getStudents: (params) => api.get('/faculty/students', { params }),
  submitGrades: (data) => api.post('/faculty/grades', data)
};

// Admin API endpoints
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data)
};

// Common API endpoints
export const commonAPI = {
  getNotices: (params) => api.get('/notices', { params }),
  getTimetable: (params) => api.get('/timetable', { params }),
  getLibraryBooks: (params) => api.get('/library/books', { params }),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;