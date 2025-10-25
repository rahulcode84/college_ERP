// server/routes/noticeRoutes.js

const express = require('express');
const router = express.Router();
const {
  getNotices,
  getNoticeDetails,
  createNotice,
  updateNotice,
  deleteNotice,
  markAsRead,
  getNoticeStats,
  getMyNotices,
  getUnreadCount
} = require('../controllers/noticeController');

const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Public notice routes (all authenticated users)
router.get('/', getNotices);
router.get('/unread-count', getUnreadCount);
router.get('/:noticeId', getNoticeDetails);
router.post('/:noticeId/read', markAsRead);

// Notice management routes (Admin, Faculty)
router.post('/', authorize(['admin', 'faculty']), createNotice);
router.put('/:noticeId', authorize(['admin', 'faculty']), updateNotice);
router.delete('/:noticeId', authorize(['admin', 'faculty']), deleteNotice);

// Statistics and personal notices
router.get('/stats', authorize(['admin', 'faculty']), getNoticeStats);
router.get('/my-notices', authorize(['admin', 'faculty']), getMyNotices);

module.exports = router;