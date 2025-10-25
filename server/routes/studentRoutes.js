// server/routes/studentRoutes.js

const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getDashboard,
  getProfile,
  updateProfile,
  getGrades,
  getAttendance,
  getEnrollments,
  getAcademicHistory,
  getFees,
  getPaymentHistory,
  getLibraryBooks,
  getNotices,
  getTimetable
} = require('../controllers/studentController');

// Import middleware
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply student authorization to all routes
router.use(authorize(['student']));

// Dashboard routes
router.get('/dashboard', getDashboard);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Academic routes
router.get('/grades', getGrades);
router.get('/attendance', getAttendance);
router.get('/enrollments', getEnrollments);
router.get('/academic-history', getAcademicHistory);

// Fee routes
router.get('/fees', getFees);
router.get('/payment-history', getPaymentHistory);

// Library routes
router.get('/library-books', getLibraryBooks);

// Notice routes
router.get('/notices', getNotices);

// Timetable routes
router.get('/timetable', getTimetable);

module.exports = router;