// server/controllers/adminController.js

const asyncHandler = require('../utils/asyncHandler');
const { User, Student, Faculty, Department, Course, Enrollment, Attendance, Fee, Notice, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboard = asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalCourses = await Course.countDocuments();

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get enrollment statistics
    const activeEnrollments = await Enrollment.countDocuments({ status: 'active' });
    const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });

    // Get fee statistics
    const totalFeesCollected = await Fee.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const pendingFees = await Fee.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get recent activity from audit logs
    const recentActivity = await AuditLog.find()
      .populate('user', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(10);

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get department-wise student count
    const studentsByDepartment = await Student.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } }
    ]);

    // Get monthly enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const enrollmentTrends = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const dashboardData = {
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          faculty: totalFaculty,
          recent: recentUsers
        },
        academic: {
          departments: totalDepartments,
          courses: totalCourses,
          activeEnrollments: activeEnrollments,
          completedEnrollments: completedEnrollments
        },
        financial: {
          totalCollected: totalFeesCollected[0]?.total || 0,
          pendingAmount: pendingFees[0]?.total || 0
        }
      },
      charts: {
        usersByRole: usersByRole,
        studentsByDepartment: studentsByDepartment,
        enrollmentTrends: enrollmentTrends
      },
      recentActivity: recentActivity
    };

    logger.info(`Admin dashboard data fetched by: ${req.user.id}`);
    return successResponse(res, 'Dashboard data retrieved successfully', dashboardData);

  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
});

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search, 
      department 
    } = req.query;

    // Build query
    let query = {};
    
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional profile data for students and faculty
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        let profileData = null;
        
        if (user.role === 'student') {
          profileData = await Student.findOne({ user: user._id })
            .populate('department', 'name code')
            .select('rollNumber studentId currentSemester cgpa');
        } else if (user.role === 'faculty') {
          profileData = await Faculty.findOne({ user: user._id })
            .populate('department', 'name code')
            .select('employeeId designation experience');
        }
        
        return {
          ...user.toObject(),
          profile: profileData
        };
      })
    );

    const userData = {
      users: enrichedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Users list fetched by admin: ${req.user.id}`);
    return successResponse(res, 'Users retrieved successfully', userData);

  } catch (error) {
    logger.error('Error fetching users:', error);
    return errorResponse(res, 'Failed to fetch users', 500);
  }
});

// @desc    Create new user account
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      // Student specific fields
      rollNumber,
      studentId,
      department,
      batch,
      currentSemester,
      // Faculty specific fields
      employeeId,
      designation,
      experience,
      qualifications
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phone,
      isEmailVerified: true, // Admin created accounts are pre-verified
      status: 'active'
    });

    await user.save();

    // Create role-specific profile
    let profile = null;
    
    if (role === 'student') {
      // Check for duplicate roll number or student ID
      const existingStudent = await Student.findOne({
        $or: [
          { rollNumber },
          { studentId }
        ]
      });
      
      if (existingStudent) {
        await User.findByIdAndDelete(user._id);
        return errorResponse(res, 'Student with this roll number or ID already exists', 400);
      }

      profile = new Student({
        user: user._id,
        rollNumber,
        studentId,
        department,
        batch,
        currentSemester: currentSemester || 1,
        currentAcademicYear: new Date().getFullYear(),
        admissionDate: new Date(),
        academicStatus: 'Active'
      });
      
    } else if (role === 'faculty') {
      // Check for duplicate employee ID
      const existingFaculty = await Faculty.findOne({ employeeId });
      if (existingFaculty) {
        await User.findByIdAndDelete(user._id);
        return errorResponse(res, 'Faculty with this employee ID already exists', 400);
      }

      profile = new Faculty({
        user: user._id,
        employeeId,
        department,
        designation,
        experience: experience || 0,
        qualifications: qualifications || [],
        joiningDate: new Date(),
        status: 'Active'
      });
    }

    if (profile) {
      await profile.save();
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_USER',
      resource: 'User',
      resourceId: user._id,
      details: `Created new ${role} account for ${firstName} ${lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    // Return user without password
    const newUser = await User.findById(user._id).select('-password -refreshToken');
    
    logger.info(`New user created by admin: ${req.user.id}, user: ${user._id}`);
    return successResponse(res, 'User created successfully', { user: newUser, profile });

  } catch (error) {
    logger.error('Error creating user:', error);
    return errorResponse(res, 'Failed to create user', 500);
  }
});

// @desc    Update user information
// @route   PUT /api/admin/users/:userId
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update user fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'status'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    // Update role-specific profile if provided
    if (user.role === 'student' && updateData.profile) {
      await Student.findOneAndUpdate(
        { user: userId },
        updateData.profile,
        { new: true }
      );
    } else if (user.role === 'faculty' && updateData.profile) {
      await Faculty.findOneAndUpdate(
        { user: userId },
        updateData.profile,
        { new: true }
      );
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_USER',
      resource: 'User',
      resourceId: userId,
      details: `Updated user information for ${user.firstName} ${user.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedUser = await User.findById(userId).select('-password -refreshToken');
    
    logger.info(`User updated by admin: ${req.user.id}, user: ${userId}`);
    return successResponse(res, 'User updated successfully', updatedUser);

  } catch (error) {
    logger.error('Error updating user:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
});

// @desc    Delete/Deactivate user account
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (permanent === 'true') {
      // Permanent deletion - use with caution
      await User.findByIdAndDelete(userId);
      
      // Also delete associated profiles
      if (user.role === 'student') {
        await Student.findOneAndDelete({ user: userId });
      } else if (user.role === 'faculty') {
        await Faculty.findOneAndDelete({ user: userId });
      }
    } else {
      // Soft delete - just deactivate
      user.status = 'inactive';
      await user.save();
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: permanent === 'true' ? 'DELETE_USER' : 'DEACTIVATE_USER',
      resource: 'User',
      resourceId: userId,
      details: `${permanent === 'true' ? 'Permanently deleted' : 'Deactivated'} user ${user.firstName} ${user.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`User ${permanent === 'true' ? 'deleted' : 'deactivated'} by admin: ${req.user.id}, user: ${userId}`);
    return successResponse(res, `User ${permanent === 'true' ? 'deleted' : 'deactivated'} successfully`);

  } catch (error) {
    logger.error('Error deleting user:', error);
    return errorResponse(res, 'Failed to delete user', 500);
  }
});

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private (Admin)
const getUserStats = asyncHandler(async (req, res) => {
  try {
    // Basic user counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });

    // Role-based statistics
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Registration trends (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Department-wise distribution
    const departmentStats = await Student.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', students: { $sum: 1 } } }
    ]);

    const facultyDeptStats = await Faculty.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', faculty: { $sum: 1 } } }
    ]);

    // Merge department statistics
    const deptStatsMap = {};
    departmentStats.forEach(stat => {
      deptStatsMap[stat._id] = { students: stat.students, faculty: 0 };
    });
    facultyDeptStats.forEach(stat => {
      if (deptStatsMap[stat._id]) {
        deptStatsMap[stat._id].faculty = stat.faculty;
      } else {
        deptStatsMap[stat._id] = { students: 0, faculty: stat.faculty };
      }
    });

    const stats = {
      overview: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers
      },
      byRole: roleStats,
      byDepartment: Object.keys(deptStatsMap).map(dept => ({
        department: dept,
        ...deptStatsMap[dept]
      })),
      trends: registrationTrends
    };

    logger.info(`User statistics fetched by admin: ${req.user.id}`);
    return successResponse(res, 'User statistics retrieved successfully', stats);

  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    return errorResponse(res, 'Failed to fetch user statistics', 500);
  }
});

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private (Admin)
const getDepartments = asyncHandler(async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('head', 'firstName lastName')
      .sort({ name: 1 });

    // Get student and faculty count for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.countDocuments({ department: dept._id });
        const facultyCount = await Faculty.countDocuments({ department: dept._id });
        const courseCount = await Course.countDocuments({ department: dept._id });
        
        return {
          ...dept.toObject(),
          counts: {
            students: studentCount,
            faculty: facultyCount,
            courses: courseCount
          }
        };
      })
    );

    logger.info(`Departments list fetched by admin: ${req.user.id}`);
    return successResponse(res, 'Departments retrieved successfully', departmentsWithCounts);

  } catch (error) {
    logger.error('Error fetching departments:', error);
    return errorResponse(res, 'Failed to fetch departments', 500);
  }
});

// @desc    Create new department
// @route   POST /api/admin/departments
// @access  Private (Admin)
const createDepartment = asyncHandler(async (req, res) => {
  try {
    const { name, code, description, head, establishedYear } = req.body;

    // Check if department with same name or code exists
    const existingDept = await Department.findOne({
      $or: [{ name }, { code }]
    });

    if (existingDept) {
      return errorResponse(res, 'Department with this name or code already exists', 400);
    }

    const department = new Department({
      name,
      code,
      description,
      head,
      establishedYear,
      isActive: true
    });

    await department.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_DEPARTMENT',
      resource: 'Department',
      resourceId: department._id,
      details: `Created new department: ${name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const newDepartment = await Department.findById(department._id)
      .populate('head', 'firstName lastName');

    logger.info(`Department created by admin: ${req.user.id}, department: ${department._id}`);
    return successResponse(res, 'Department created successfully', newDepartment);

  } catch (error) {
    logger.error('Error creating department:', error);
    return errorResponse(res, 'Failed to create department', 500);
  }
});

// @desc    Update department details
// @route   PUT /api/admin/departments/:departmentId
// @access  Private (Admin)
const updateDepartment = asyncHandler(async (req, res) => {
  try {
    const { departmentId } = req.params;
    const updateData = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    // Update department fields
    const allowedFields = ['name', 'code', 'description', 'head', 'establishedYear', 'isActive'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        department[field] = updateData[field];
      }
    });

    await department.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_DEPARTMENT',
      resource: 'Department',
      resourceId: departmentId,
      details: `Updated department: ${department.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedDepartment = await Department.findById(departmentId)
      .populate('head', 'firstName lastName');

    logger.info(`Department updated by admin: ${req.user.id}, department: ${departmentId}`);
    return successResponse(res, 'Department updated successfully', updatedDepartment);

  } catch (error) {
    logger.error('Error updating department:', error);
    return errorResponse(res, 'Failed to update department', 500);
  }
});

// @desc    Delete department
// @route   DELETE /api/admin/departments/:departmentId
// @access  Private (Admin)
const deleteDepartment = asyncHandler(async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    // Check if department has students or faculty
    const studentCount = await Student.countDocuments({ department: departmentId });
    const facultyCount = await Faculty.countDocuments({ department: departmentId });

    if (studentCount > 0 || facultyCount > 0) {
      return errorResponse(res, 'Cannot delete department with existing students or faculty', 400);
    }

    await Department.findByIdAndDelete(departmentId);

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'DELETE_DEPARTMENT',
      resource: 'Department',
      resourceId: departmentId,
      details: `Deleted department: ${department.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Department deleted by admin: ${req.user.id}, department: ${departmentId}`);
    return successResponse(res, 'Department deleted successfully');

  } catch (error) {
    logger.error('Error deleting department:', error);
    return errorResponse(res, 'Failed to delete department', 500);
  }
});

// @desc    Get system statistics
// @route   GET /api/admin/system-stats
// @access  Private (Admin)
const getSystemStats = asyncHandler(async (req, res) => {
  try {
    // Database statistics
    const dbStats = {
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      faculty: await Faculty.countDocuments(),
      departments: await Department.countDocuments(),
      courses: await Course.countDocuments(),
      enrollments: await Enrollment.countDocuments(),
      attendanceRecords: await Attendance.countDocuments(),
      feeRecords: await Fee.countDocuments(),
      notices: await Notice.countDocuments()
    };

    // System activity (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const recentActivity = {
      logins: await AuditLog.countDocuments({
        action: 'LOGIN',
        timestamp: { $gte: twentyFourHoursAgo }
      }),
      registrations: await User.countDocuments({
        createdAt: { $gte: twentyFourHoursAgo }
      }),
      attendanceMarked: await Attendance.countDocuments({
        markedAt: { $gte: twentyFourHoursAgo }
      }),
      feesCollected: await Fee.countDocuments({
        status: 'paid',
        paymentDate: { $gte: twentyFourHoursAgo }
      })
    };

    // Performance metrics
    const performanceMetrics = {
      averageResponseTime: '< 200ms', // This would be calculated from actual metrics in production
      uptime: '99.9%',
      errorRate: '0.1%',
      activeConnections: 150 // This would come from server metrics
    };

    const systemStats = {
      database: dbStats,
      activity: recentActivity,
      performance: performanceMetrics,
      lastUpdated: new Date()
    };

    logger.info(`System statistics fetched by admin: ${req.user.id}`);
    return successResponse(res, 'System statistics retrieved successfully', systemStats);

  } catch (error) {
    logger.error('Error fetching system statistics:', error);
    return errorResponse(res, 'Failed to fetch system statistics', 500);
  }
});

// @desc    Generate administrative reports
// @route   POST /api/admin/reports
// @access  Private (Admin)
const generateReports = asyncHandler(async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters } = req.body;

    let reportData = {};

    switch (reportType) {
      case 'user_activity':
        reportData = await generateUserActivityReport(startDate, endDate, filters);
        break;
      case 'academic_performance':
        reportData = await generateAcademicPerformanceReport(startDate, endDate, filters);
        break;
      case 'financial':
        reportData = await generateFinancialReport(startDate, endDate, filters);
        break;
      case 'attendance':
        reportData = await generateAttendanceReport(startDate, endDate, filters);
        break;
      default:
        return errorResponse(res, 'Invalid report type', 400);
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'GENERATE_REPORT',
      resource: 'Report',
      details: `Generated ${reportType} report`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Report generated by admin: ${req.user.id}, type: ${reportType}`);
    return successResponse(res, 'Report generated successfully', {
      reportType,
      generatedAt: new Date(),
      data: reportData
    });

  } catch (error) {
    logger.error('Error generating report:', error);
    return errorResponse(res, 'Failed to generate report', 500);
  }
});

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      userId, 
      resource,
      startDate,
      endDate 
    } = req.query;

    let query = {};
    
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (resource) query.resource = resource;
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const auditLogs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    const logsData = {
      logs: auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Audit logs fetched by admin: ${req.user.id}`);
    return successResponse(res, 'Audit logs retrieved successfully', logsData);

  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    return errorResponse(res, 'Failed to fetch audit logs', 500);
  }
});

// Helper functions for report generation
const generateUserActivityReport = async (startDate, endDate, filters) => {
  // Implementation for user activity report
  return { reportType: 'user_activity', data: 'Report data here' };
};

const generateAcademicPerformanceReport = async (startDate, endDate, filters) => {
  // Implementation for academic performance report
  return { reportType: 'academic_performance', data: 'Report data here' };
};

const generateFinancialReport = async (startDate, endDate, filters) => {
  // Implementation for financial report
  return { reportType: 'financial', data: 'Report data here' };
};

const generateAttendanceReport = async (startDate, endDate, filters) => {
  // Implementation for attendance report
  return { reportType: 'attendance', data: 'Report data here' };
};

module.exports = {
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
};