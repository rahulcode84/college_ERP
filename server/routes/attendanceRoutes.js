// server/routes/attendanceRoutes.js

const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  updateAttendance,
  getAttendanceStats,
  exportAttendance,
  getStudentAttendanceSummary
} = require('../controllers/attendanceController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Attendance management routes
router.post('/mark', authorize(['admin', 'faculty']), markAttendance);
router.get('/', getAttendance); // All authenticated users (role-based filtering applied in controller)
router.put('/:attendanceId', authorize(['admin', 'faculty']), updateAttendance);

// Statistics and reports
router.get('/stats', getAttendanceStats);
router.get('/export', authorize(['admin', 'faculty']), exportAttendance);

// Student specific routes
router.get('/student/:studentId/summary', getStudentAttendanceSummary);

module.exports = router;