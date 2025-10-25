// server/routes/facultyRoutes.js

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getProfile,
  updateProfile,
  getClasses,
  getStudents,
  getCourseDetails,
  markAttendance,
  getAttendanceReport,
  submitGrades,
  getGradeHistory,
  getTimetable,
  getNotices,
  uploadMaterial
} = require('../controllers/facultyController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply faculty authorization to all routes
router.use(authorize(['faculty']));

// Dashboard routes
router.get('/dashboard', getDashboard);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Class management routes
router.get('/classes', getClasses);
router.get('/students', getStudents);
router.get('/courses/:courseId', getCourseDetails);

// Attendance routes
router.post('/attendance/mark', markAttendance);
router.get('/attendance/report', getAttendanceReport);

// Grade management routes
router.post('/grades/submit', submitGrades);
router.get('/grades/history', getGradeHistory);

// Schedule routes
router.get('/timetable', getTimetable);

// Notice routes
router.get('/notices', getNotices);

// Course material routes
router.post('/upload-material', uploadMaterial);

module.exports = router;