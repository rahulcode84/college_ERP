// server/routes/timetableRoutes.js

const express = require('express');
const router = express.Router();
const {
  getTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  approveTimetable,
  getConflicts,
  exportTimetable,
  getMySchedule
} = require('../controllers/timetableController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Public timetable routes (all authenticated users)
router.get('/', getTimetable); // Role-based filtering applied in controller
router.get('/:timetableId', getTimetableById);
router.get('/:timetableId/export', exportTimetable);

// Faculty personal schedule
router.get('/my-schedule', authorize(['faculty']), getMySchedule);

// Timetable management routes (Admin, Faculty)
router.post('/', authorize(['admin', 'faculty']), createTimetable);
router.put('/:timetableId', authorize(['admin', 'faculty']), updateTimetable);

// Administrative routes (Admin only)
router.post('/:timetableId/approve', authorize(['admin']), approveTimetable);
router.get('/conflicts', authorize(['admin', 'faculty']), getConflicts);

module.exports = router;