// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSystemStats,
  generateReports,
  getAuditLogs
} = require('../controllers/adminController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin authorization to all routes
router.use(authorize(['admin']));

// Dashboard routes
router.get('/dashboard', getDashboard);

// User management routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/users/stats', getUserStats);

// Department management routes
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:departmentId', updateDepartment);
router.delete('/departments/:departmentId', deleteDepartment);

// System management routes
router.get('/system-stats', getSystemStats);
router.post('/reports', generateReports);
router.get('/audit-logs', getAuditLogs);

module.exports = router;