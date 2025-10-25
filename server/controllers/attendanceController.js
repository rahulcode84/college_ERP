// server/controllers/attendanceController.js

const asyncHandler = require('../utils/asyncHandler');
const { Attendance, Student, Faculty, Course, Enrollment, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Mark attendance for students
// @route   POST /api/attendance/mark
// @access  Private (Faculty, Admin)
const markAttendance = asyncHandler(async (req, res) => {
  try {
    const { courseId, date, period, attendanceData } = req.body;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to mark attendance', 403);
    }

    // Get faculty if the user is faculty
    let faculty = null;
    if (req.user.role === 'faculty') {
      faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
    }

    // Verify course exists and faculty has access
    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user.role === 'faculty') {
      const hasAccess = course.faculty.coordinator.equals(faculty._id) || 
                       course.faculty.instructors.includes(faculty._id);
      if (!hasAccess) {
        return errorResponse(res, 'Access denied for this course', 403);
      }
    }

    // Validate date
    const attendanceDate = new Date(date);
    if (attendanceDate > new Date()) {
      return errorResponse(res, 'Cannot mark attendance for future dates', 400);
    }

    // Validate period
    if (!period || period < 1 || period > 8) {
      return errorResponse(res, 'Invalid period. Must be between 1-8', 400);
    }

    const attendanceRecords = [];
    const errors = [];

    // Process attendance data
    for (const record of attendanceData) {
      try {
        const { studentId, status } = record;

        // Validate student exists and is enrolled in the course
        const student = await Student.findById(studentId);
        if (!student) {
          errors.push(`Student with ID ${studentId} not found`);
          continue;
        }

        const enrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          status: 'active'
        });

        if (!enrollment) {
          errors.push(`Student ${student.rollNumber} is not enrolled in this course`);
          continue;
        }

        // Check if attendance already exists
        let attendanceRecord = await Attendance.findOne({
          student: studentId,
          course: courseId,
          date: attendanceDate,
          period: period
        });

        if (attendanceRecord) {
          // Update existing record
          attendanceRecord.status = status;
          attendanceRecord.markedBy = faculty ? faculty._id : req.user.id;
          attendanceRecord.markedAt = new Date();
          await attendanceRecord.save();
        } else {
          // Create new record
          attendanceRecord = new Attendance({
            student: studentId,
            course: courseId,
            faculty: faculty ? faculty._id : null,
            date: attendanceDate,
            period: period,
            status: status,
            markedBy: faculty ? faculty._id : req.user.id,
            markedAt: new Date(),
            academicYear: course.academicYear,
            semester: course.semester
          });
          await attendanceRecord.save();
        }

        attendanceRecords.push(attendanceRecord);

      } catch (error) {
        errors.push(`Error processing student ${record.studentId}: ${error.message}`);
      }
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'MARK_ATTENDANCE',
      resource: 'Attendance',
      details: `Marked attendance for course ${course.code} on ${attendanceDate.toDateString()}, period ${period}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const result = {
      course: course.name,
      date: attendanceDate,
      period: period,
      recordsProcessed: attendanceRecords.length,
      successfulRecords: attendanceRecords.length,
      errors: errors
    };

    logger.info(`Attendance marked by user: ${req.user.id}, course: ${courseId}, records: ${attendanceRecords.length}`);
    return successResponse(res, 'Attendance marked successfully', result);

  } catch (error) {
    logger.error('Error marking attendance:', error);
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
});

// @desc    Get attendance records with filtering
// @route   GET /api/attendance
// @access  Private (All authenticated users)
const getAttendance = asyncHandler(async (req, res) => {
  try {
    const { 
      courseId, 
      studentId, 
      date, 
      fromDate, 
      toDate, 
      status,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'student') {
      // Students can only see their own attendance
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      query.student = student._id;
    } else if (req.user.role === 'faculty') {
      // Faculty can see attendance for their courses
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
      
      const facultyCourses = await Course.find({
        $or: [
          { 'faculty.coordinator': faculty._id },
          { 'faculty.instructors': faculty._id }
        ]
      }).select('_id');
      
      query.course = { $in: facultyCourses.map(c => c._id) };
    }
    // Admin can see all attendance records

    // Apply additional filters
    if (courseId) query.course = courseId;
    if (studentId && req.user.role !== 'student') query.student = studentId;
    if (status) query.status = status;
    
    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    } else if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name code')
      .populate('faculty', 'firstName lastName')
      .sort({ date: -1, period: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    // Calculate summary statistics
    const summaryQuery = { ...query };
    delete summaryQuery.date; // Remove date filter for overall stats

    const summary = await Attendance.aggregate([
      { $match: summaryQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryStats = summary.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      acc.total = (acc.total || 0) + stat.count;
      return acc;
    }, {});

    const attendanceData = {
      records: attendanceRecords,
      summary: summaryStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Attendance records fetched by user: ${req.user.id}`);
    return successResponse(res, 'Attendance records retrieved successfully', attendanceData);

  } catch (error) {
    logger.error('Error fetching attendance records:', error);
    return errorResponse(res, 'Failed to fetch attendance records', 500);
  }
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:attendanceId
// @access  Private (Faculty, Admin)
const updateAttendance = asyncHandler(async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to update attendance', 403);
    }

    const attendanceRecord = await Attendance.findById(attendanceId)
      .populate('course', 'faculty');

    if (!attendanceRecord) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    // Check if faculty has access to this course
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }

      const hasAccess = attendanceRecord.course.faculty.coordinator.equals(faculty._id) || 
                       attendanceRecord.course.faculty.instructors.includes(faculty._id);
      if (!hasAccess) {
        return errorResponse(res, 'Access denied for this course', 403);
      }
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status. Must be one of: present, absent, late, excused', 400);
    }

    attendanceRecord.status = status;
    attendanceRecord.lastModifiedBy = req.user.id;
    attendanceRecord.lastModifiedAt = new Date();
    await attendanceRecord.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_ATTENDANCE',
      resource: 'Attendance',
      resourceId: attendanceId,
      details: `Updated attendance status to ${status}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedRecord = await Attendance.findById(attendanceId)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name code')
      .populate('faculty', 'firstName lastName');

    logger.info(`Attendance updated by user: ${req.user.id}, record: ${attendanceId}`);
    return successResponse(res, 'Attendance record updated successfully', updatedRecord);

  } catch (error) {
    logger.error('Error updating attendance record:', error);
    return errorResponse(res, 'Failed to update attendance record', 500);
  }
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private (All authenticated users)
const getAttendanceStats = asyncHandler(async (req, res) => {
  try {
    const { courseId, studentId, fromDate, toDate } = req.query;

    let matchQuery = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      matchQuery.student = student._id;
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
      
      const facultyCourses = await Course.find({
        $or: [
          { 'faculty.coordinator': faculty._id },
          { 'faculty.instructors': faculty._id }
        ]
      }).select('_id');
      
      matchQuery.course = { $in: facultyCourses.map(c => c._id) };
    }

    // Apply filters
    if (courseId) matchQuery.course = courseId;
    if (studentId && req.user.role !== 'student') matchQuery.student = studentId;
    if (fromDate && toDate) {
      matchQuery.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // Overall statistics
    const overallStats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          excused: {
            $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
          }
        }
      }
    ]);

    // Course-wise statistics
    const courseStats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          course: '$course.name',
          courseCode: '$course.code',
          total: 1,
          present: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
            ]
          }
        }
      }
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendQuery = { ...matchQuery };
    trendQuery.date = { $gte: sixMonthsAgo };

    const monthlyTrends = await Attendance.aggregate([
      { $match: trendQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          present: 1,
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const stats = {
      overall: overallStats[0] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
      byCourse: courseStats,
      monthlyTrends: monthlyTrends,
      overallPercentage: overallStats[0] ? 
        ((overallStats[0].present / overallStats[0].total) * 100).toFixed(1) : 0
    };

    logger.info(`Attendance statistics fetched by user: ${req.user.id}`);
    return successResponse(res, 'Attendance statistics retrieved successfully', stats);

  } catch (error) {
    logger.error('Error fetching attendance statistics:', error);
    return errorResponse(res, 'Failed to fetch attendance statistics', 500);
  }
});

// @desc    Export attendance data
// @route   GET /api/attendance/export
// @access  Private (Faculty, Admin)
const exportAttendance = asyncHandler(async (req, res) => {
  try {
    const { courseId, fromDate, toDate, format = 'csv' } = req.query;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to export attendance', 403);
    }

    let query = {};

    // Role-based filtering
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
      
      const facultyCourses = await Course.find({
        $or: [
          { 'faculty.coordinator': faculty._id },
          { 'faculty.instructors': faculty._id }
        ]
      }).select('_id');
      
      query.course = { $in: facultyCourses.map(c => c._id) };
    }

    // Apply filters
    if (courseId) query.course = courseId;
    if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name code')
      .populate('faculty', 'firstName lastName')
      .sort({ date: -1, period: 1 });

    // Format data for export
    const exportData = attendanceRecords.map(record => ({
      Date: record.date.toDateString(),
      Period: record.period,
      Course: `${record.course.code} - ${record.course.name}`,
      StudentRollNumber: record.student.rollNumber,
      StudentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
      Status: record.status,
      MarkedBy: record.faculty ? `${record.faculty.firstName} ${record.faculty.lastName}` : 'System',
      MarkedAt: record.markedAt.toLocaleString()
    }));

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'EXPORT_ATTENDANCE',
      resource: 'Attendance',
      details: `Exported ${exportData.length} attendance records`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Attendance data exported by user: ${req.user.id}, records: ${exportData.length}`);
    return successResponse(res, 'Attendance data exported successfully', {
      format: format,
      recordCount: exportData.length,
      data: exportData,
      exportedAt: new Date()
    });

  } catch (error) {
    logger.error('Error exporting attendance data:', error);
    return errorResponse(res, 'Failed to export attendance data', 500);
  }
});

// @desc    Get attendance summary for a specific student
// @route   GET /api/attendance/student/:studentId/summary
// @access  Private (Faculty, Admin, Student - own data only)
const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check permission
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || !student._id.equals(studentId)) {
        return errorResponse(res, 'Access denied', 403);
      }
    } else if (req.user.role === 'faculty') {
      // Faculty can only see students in their courses
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
      
      const facultyCourses = await Course.find({
        $or: [
          { 'faculty.coordinator': faculty._id },
          { 'faculty.instructors': faculty._id }
        ]
      }).select('_id');
      
      const studentEnrollments = await Enrollment.find({
        student: studentId,
        course: { $in: facultyCourses.map(c => c._id) }
      });
      
      if (studentEnrollments.length === 0) {
        return errorResponse(res, 'Student not found in your courses', 404);
      }
    }

    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName')
      .populate('department', 'name');

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Get attendance summary by course
    const attendanceSummary = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          excused: {
            $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          course: '$course.name',
          courseCode: '$course.code',
          total: 1,
          present: 1,
          absent: 1,
          late: 1,
          excused: 1,
          percentage: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
            ]
          }
        }
      }
    ]);

    // Overall statistics
    const overallStats = attendanceSummary.reduce((acc, course) => {
      acc.total += course.total;
      acc.present += course.present;
      acc.absent += course.absent;
      acc.late += course.late;
      acc.excused += course.excused;
      return acc;
    }, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });

    overallStats.percentage = overallStats.total > 0 ? 
      ((overallStats.present / overallStats.total) * 100).toFixed(1) : 0;

    const summaryData = {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        department: student.department.name
      },
      overall: overallStats,
      byCourse: attendanceSummary
    };

    logger.info(`Student attendance summary fetched by user: ${req.user.id}, student: ${studentId}`);
    return successResponse(res, 'Student attendance summary retrieved successfully', summaryData);

  } catch (error) {
    logger.error('Error fetching student attendance summary:', error);
    return errorResponse(res, 'Failed to fetch student attendance summary', 500);
  }
});

module.exports = {
  markAttendance,
  getAttendance,
  updateAttendance,
  getAttendanceStats,
  exportAttendance,
  getStudentAttendanceSummary
};