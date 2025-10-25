// server/controllers/noticeController.js

const asyncHandler = require('../utils/asyncHandler');
const { Notice, Student, Faculty, Department, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get notices with filtering and targeting
// @route   GET /api/notices
// @access  Private (All authenticated users)
const getNotices = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      priority, 
      department,
      status = 'active',
      search 
    } = req.query;

    // Build base query
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        query.$or = [
          { targetRoles: 'all' },
          { targetRoles: 'student' },
          { targetDepartments: student.department }
        ];
      }
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty) {
        query.$or = [
          { targetRoles: 'all' },
          { targetRoles: 'faculty' },
          { targetDepartments: faculty.department }
        ];
      }
    }
    // Admin can see all notices

    // Apply additional filters
    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;
    if (department && department !== 'all') query.targetDepartments = department;
    if (status && status !== 'all') query.isActive = status === 'active';
    
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      delete query.$or;
    }

    const notices = await Notice.find(query)
      .populate('publishedBy', 'firstName lastName role')
      .populate('targetDepartments', 'name code')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notice.countDocuments(query);

    // Mark notices as read for the current user
    if (notices.length > 0) {
      const noticeIds = notices.map(notice => notice._id);
      await Notice.updateMany(
        { 
          _id: { $in: noticeIds },
          'views.user': { $ne: req.user.id }
        },
        {
          $push: {
            views: {
              user: req.user.id,
              viewedAt: new Date()
            }
          }
        }
      );
    }

    // Get categories for filter
    const categories = await Notice.distinct('category', { isActive: true });

    const noticeData = {
      notices: notices,
      filters: {
        categories: categories
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotices: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Notices fetched by user: ${req.user.id}`);
    return successResponse(res, 'Notices retrieved successfully', noticeData);

  } catch (error) {
    logger.error('Error fetching notices:', error);
    return errorResponse(res, 'Failed to fetch notices', 500);
  }
});

// @desc    Get single notice details
// @route   GET /api/notices/:noticeId
// @access  Private (All authenticated users)
const getNoticeDetails = asyncHandler(async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findById(noticeId)
      .populate('publishedBy', 'firstName lastName role')
      .populate('targetDepartments', 'name code');

    if (!notice) {
      return errorResponse(res, 'Notice not found', 404);
    }

    // Check if user has access to this notice
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (notice.targetRoles === 'all') {
      hasAccess = true;
    } else if (notice.targetRoles === req.user.role) {
      hasAccess = true;
    } else if (notice.targetDepartments.length > 0) {
      // Check department access
      let userDepartment = null;
      if (req.user.role === 'student') {
        const student = await Student.findOne({ user: req.user.id });
        userDepartment = student?.department;
      } else if (req.user.role === 'faculty') {
        const faculty = await Faculty.findOne({ user: req.user.id });
        userDepartment = faculty?.department;
      }
      
      if (userDepartment) {
        hasAccess = notice.targetDepartments.some(dept => 
          dept._id.equals(userDepartment)
        );
      }
    }

    if (!hasAccess) {
      return errorResponse(res, 'Access denied for this notice', 403);
    }

    // Mark as read if not already read
    const alreadyViewed = notice.views.some(view => 
      view.user.equals(req.user.id)
    );

    if (!alreadyViewed) {
      notice.views.push({
        user: req.user.id,
        viewedAt: new Date()
      });
      await notice.save();
    }

    // Get view statistics (for admin/faculty)
    let viewStats = null;
    if (req.user.role === 'admin' || 
        (req.user.role === 'faculty' && notice.publishedBy._id.equals(req.user.id))) {
      viewStats = {
        totalViews: notice.views.length,
        uniqueViewers: notice.views.length,
        recentViews: notice.views.slice(-10)
      };
    }

    const noticeDetails = {
      notice: notice,
      viewStats: viewStats,
      userHasViewed: true
    };

    logger.info(`Notice details fetched by user: ${req.user.id}, notice: ${noticeId}`);
    return successResponse(res, 'Notice details retrieved successfully', noticeDetails);

  } catch (error) {
    logger.error('Error fetching notice details:', error);
    return errorResponse(res, 'Failed to fetch notice details', 500);
  }
});

// @desc    Create new notice
// @route   POST /api/notices
// @access  Private (Admin, Faculty)
const createNotice = asyncHandler(async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to create notices', 403);
    }

    const {
      title,
      content,
      category,
      priority,
      targetRoles,
      targetDepartments,
      expiryDate,
      attachments,
      isUrgent
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return errorResponse(res, 'Title and content are required', 400);
    }

    // Validate target roles
    const validRoles = ['all', 'student', 'faculty', 'admin'];
    if (targetRoles && !validRoles.includes(targetRoles)) {
      return errorResponse(res, 'Invalid target role', 400);
    }

    // Validate departments if specified
    if (targetDepartments && targetDepartments.length > 0) {
      const departments = await Department.find({
        _id: { $in: targetDepartments }
      });
      if (departments.length !== targetDepartments.length) {
        return errorResponse(res, 'One or more invalid department IDs', 400);
      }
    }

    const notice = new Notice({
      title,
      content,
      category: category || 'general',
      priority: priority || 'medium',
      targetRoles: targetRoles || 'all',
      targetDepartments: targetDepartments || [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachments: attachments || [],
      isUrgent: isUrgent || false,
      publishedBy: req.user.id,
      publishedAt: new Date(),
      isActive: true
    });

    await notice.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_NOTICE',
      resource: 'Notice',
      resourceId: notice._id,
      details: `Created notice: ${title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const newNotice = await Notice.findById(notice._id)
      .populate('publishedBy', 'firstName lastName role')
      .populate('targetDepartments', 'name code');

    logger.info(`Notice created by user: ${req.user.id}, notice: ${notice._id}`);
    return successResponse(res, 'Notice created successfully', newNotice);

  } catch (error) {
    logger.error('Error creating notice:', error);
    return errorResponse(res, 'Failed to create notice', 500);
  }
});

// @desc    Update notice
// @route   PUT /api/notices/:noticeId
// @access  Private (Admin, Notice Author)
const updateNotice = asyncHandler(async (req, res) => {
  try {
    const { noticeId } = req.params;
    const updateData = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return errorResponse(res, 'Notice not found', 404);
    }

    // Check permission - Admin or notice author can update
    if (req.user.role !== 'admin' && !notice.publishedBy.equals(req.user.id)) {
      return errorResponse(res, 'Insufficient permissions to update this notice', 403);
    }

    // Validate departments if being updated
    if (updateData.targetDepartments && updateData.targetDepartments.length > 0) {
      const departments = await Department.find({
        _id: { $in: updateData.targetDepartments }
      });
      if (departments.length !== updateData.targetDepartments.length) {
        return errorResponse(res, 'One or more invalid department IDs', 400);
      }
    }

    // Update notice fields
    const allowedFields = [
      'title', 'content', 'category', 'priority', 'targetRoles',
      'targetDepartments', 'expiryDate', 'attachments', 'isUrgent', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        notice[field] = updateData[field];
      }
    });

    notice.lastModifiedBy = req.user.id;
    notice.lastModifiedAt = new Date();
    await notice.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_NOTICE',
      resource: 'Notice',
      resourceId: noticeId,
      details: `Updated notice: ${notice.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedNotice = await Notice.findById(noticeId)
      .populate('publishedBy', 'firstName lastName role')
      .populate('targetDepartments', 'name code');

    logger.info(`Notice updated by user: ${req.user.id}, notice: ${noticeId}`);
    return successResponse(res, 'Notice updated successfully', updatedNotice);

  } catch (error) {
    logger.error('Error updating notice:', error);
    return errorResponse(res, 'Failed to update notice', 500);
  }
});

// @desc    Delete notice
// @route   DELETE /api/notices/:noticeId
// @access  Private (Admin, Notice Author)
const deleteNotice = asyncHandler(async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return errorResponse(res, 'Notice not found', 404);
    }

    // Check permission - Admin or notice author can delete
    if (req.user.role !== 'admin' && !notice.publishedBy.equals(req.user.id)) {
      return errorResponse(res, 'Insufficient permissions to delete this notice', 403);
    }

    // Soft delete - just mark as inactive
    notice.isActive = false;
    notice.deletedBy = req.user.id;
    notice.deletedAt = new Date();
    await notice.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'DELETE_NOTICE',
      resource: 'Notice',
      resourceId: noticeId,
      details: `Deleted notice: ${notice.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Notice deleted by user: ${req.user.id}, notice: ${noticeId}`);
    return successResponse(res, 'Notice deleted successfully');

  } catch (error) {
    logger.error('Error deleting notice:', error);
    return errorResponse(res, 'Failed to delete notice', 500);
  }
});

// @desc    Mark notice as read
// @route   POST /api/notices/:noticeId/read
// @access  Private (All authenticated users)
const markAsRead = asyncHandler(async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return errorResponse(res, 'Notice not found', 404);
    }

    // Check if already marked as read
    const alreadyRead = notice.views.some(view => 
      view.user.equals(req.user.id)
    );

    if (alreadyRead) {
      return successResponse(res, 'Notice already marked as read');
    }

    // Add view record
    notice.views.push({
      user: req.user.id,
      viewedAt: new Date()
    });

    await notice.save();

    logger.info(`Notice marked as read by user: ${req.user.id}, notice: ${noticeId}`);
    return successResponse(res, 'Notice marked as read successfully');

  } catch (error) {
    logger.error('Error marking notice as read:', error);
    return errorResponse(res, 'Failed to mark notice as read', 500);
  }
});

// @desc    Get notice statistics
// @route   GET /api/notices/stats
// @access  Private (Admin, Faculty)
const getNoticeStats = asyncHandler(async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to view notice statistics', 403);
    }

    let matchQuery = { isActive: true };
    
    // Faculty can only see stats for their own notices
    if (req.user.role === 'faculty') {
      matchQuery.publishedBy = req.user.id;
    }

    // Overall statistics
    const overallStats = await Notice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalNotices: { $sum: 1 },
          urgentNotices: {
            $sum: { $cond: ['$isUrgent', 1, 0] }
          },
          totalViews: { $sum: { $size: '$views' } },
          avgViewsPerNotice: { $avg: { $size: '$views' } }
        }
      }
    ]);

    // Category-wise statistics
    const categoryStats = await Notice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: { $size: '$views' } },
          avgViews: { $avg: { $size: '$views' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Priority-wise statistics
    const priorityStats = await Notice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalViews: { $sum: { $size: '$views' } }
        }
      }
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Notice.aggregate([
      { 
        $match: { 
          ...matchQuery,
          publishedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top viewed notices
    const topNotices = await Notice.find(matchQuery)
      .sort({ 'views': -1 })
      .limit(5)
      .populate('publishedBy', 'firstName lastName')
      .select('title views category publishedAt');

    const stats = {
      overall: overallStats[0] || {
        totalNotices: 0,
        urgentNotices: 0,
        totalViews: 0,
        avgViewsPerNotice: 0
      },
      byCategory: categoryStats,
      byPriority: priorityStats,
      recentActivity: recentActivity,
      topNotices: topNotices.map(notice => ({
        title: notice.title,
        category: notice.category,
        views: notice.views.length,
        publishedAt: notice.publishedAt,
        publishedBy: notice.publishedBy
      }))
    };

    logger.info(`Notice statistics fetched by user: ${req.user.id}`);
    return successResponse(res, 'Notice statistics retrieved successfully', stats);

  } catch (error) {
    logger.error('Error fetching notice statistics:', error);
    return errorResponse(res, 'Failed to fetch notice statistics', 500);
  }
});

// @desc    Get my notices (created by current user)
// @route   GET /api/notices/my-notices
// @access  Private (Faculty, Admin)
const getMyNotices = asyncHandler(async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Only faculty and admin can view their notices', 403);
    }

    const { 
      page = 1, 
      limit = 10, 
      status = 'all' 
    } = req.query;

    let query = { publishedBy: req.user.id };
    
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    const notices = await Notice.find(query)
      .populate('targetDepartments', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notice.countDocuments(query);

    // Add view statistics to each notice
    const noticesWithStats = notices.map(notice => ({
      ...notice.toObject(),
      viewCount: notice.views.length,
      recentViews: notice.views.slice(-5)
    }));

    const myNoticesData = {
      notices: noticesWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotices: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`My notices fetched by user: ${req.user.id}`);
    return successResponse(res, 'My notices retrieved successfully', myNoticesData);

  } catch (error) {
    logger.error('Error fetching my notices:', error);
    return errorResponse(res, 'Failed to fetch my notices', 500);
  }
});

// @desc    Get unread notices count
// @route   GET /api/notices/unread-count
// @access  Private (All authenticated users)
const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    // Build query based on user role
    let query = { 
      isActive: true,
      'views.user': { $ne: req.user.id }
    };

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        query.$or = [
          { targetRoles: 'all' },
          { targetRoles: 'student' },
          { targetDepartments: student.department }
        ];
      }
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty) {
        query.$or = [
          { targetRoles: 'all' },
          { targetRoles: 'faculty' },
          { targetDepartments: faculty.department }
        ];
      }
    }

    const unreadCount = await Notice.countDocuments(query);

    // Get urgent unread notices count
    const urgentUnreadCount = await Notice.countDocuments({
      ...query,
      isUrgent: true
    });

    const countData = {
      unreadCount: unreadCount,
      urgentUnreadCount: urgentUnreadCount
    };

    return successResponse(res, 'Unread notices count retrieved successfully', countData);

  } catch (error) {
    logger.error('Error fetching unread notices count:', error);
    return errorResponse(res, 'Failed to fetch unread notices count', 500);
  }
});

module.exports = {
  getNotices,
  getNoticeDetails,
  createNotice,
  updateNotice,
  deleteNotice,
  markAsRead,
  getNoticeStats,
  getMyNotices,
  getUnreadCount
};