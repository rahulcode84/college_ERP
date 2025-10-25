// server/routes/courseRoutes.js

const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollments,
  enrollStudent,
  withdrawStudent,
  getSyllabus,
  updateSyllabus
} = require('../controllers/courseController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Public course routes (all authenticated users)
router.get('/', getCourses);
router.get('/:courseId', getCourseDetails);
router.get('/:courseId/syllabus', getSyllabus);

// Course management routes (Admin, Faculty)
router.post('/', authorize(['admin', 'faculty']), createCourse);
router.put('/:courseId', authorize(['admin', 'faculty']), updateCourse);
router.delete('/:courseId', authorize(['admin']), deleteCourse);
router.put('/:courseId/syllabus', authorize(['admin', 'faculty']), updateSyllabus);

// Enrollment management routes
router.get('/:courseId/enrollments', authorize(['admin', 'faculty']), getEnrollments);
router.post('/:courseId/enroll', authorize(['admin', 'student']), enrollStudent);
router.delete('/:courseId/withdraw', authorize(['admin', 'student']), withdrawStudent);

module.exports = router;