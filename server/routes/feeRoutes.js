// server/routes/feeRoutes.js

const express = require('express');
const router = express.Router();
const {
  getFeeStructure,
  processPayment,
  getPaymentHistory,
  generateReceipt,
  manageConcessions,
  getFeeReports,
  createBulkFees
} = require('../controllers/feeController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Fee structure and payment routes
router.get('/structure', getFeeStructure); // All authenticated users (role-based filtering applied)
router.post('/payment', authorize(['admin', 'student']), processPayment);
router.get('/payment-history', getPaymentHistory);
router.get('/receipt/:feeId', generateReceipt);

// Administrative routes
router.post('/concession', authorize(['admin']), manageConcessions);
router.get('/reports', authorize(['admin', 'faculty']), getFeeReports);
router.post('/bulk-create', authorize(['admin']), createBulkFees);

module.exports = router;