export const USER_ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
  LIBRARIAN: 'librarian'
};

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Student routes
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    PROFILE: '/student/profile',
    ATTENDANCE: '/student/attendance',
    GRADES: '/student/grades',
    FEES: '/student/fees',
    COURSES: '/student/courses',
    LIBRARY: '/student/library'
  },
  
  // Faculty routes
  FACULTY: {
    DASHBOARD: '/faculty/dashboard',
    PROFILE: '/faculty/profile',
    CLASSES: '/faculty/classes',
    STUDENTS: '/faculty/students',
    ATTENDANCE: '/faculty/attendance',
    GRADES: '/faculty/grades'
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    DEPARTMENTS: '/admin/departments',
    COURSES: '/admin/courses',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings'
  }
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  }
};

export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  USER_PREFERENCES: 'userPreferences'
};

export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful!',
    LOGOUT: 'Logged out successfully',
    REGISTER: 'Registration successful!',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
  },
  ERROR: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    NETWORK_ERROR: 'Network error. Please try again.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.'
  }
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

export const FEE_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

export const GRADE_SCALE = {
  'A+': { points: 10, color: 'text-green-600' },
  'A': { points: 9, color: 'text-green-500' },
  'B+': { points: 8, color: 'text-blue-600' },
  'B': { points: 7, color: 'text-blue-500' },
  'C+': { points: 6, color: 'text-yellow-600' },
  'C': { points: 5, color: 'text-yellow-500' },
  'D': { points: 4, color: 'text-orange-500' },
  'F': { points: 0, color: 'text-red-500' }
};