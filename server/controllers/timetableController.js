// server/controllers/timetableController.js

const asyncHandler = require('../utils/asyncHandler');
const { Timetable, Department, Course, Faculty, Student, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get timetable
// @route   GET /api/timetable
// @access  Private (All authenticated users)
const getTimetable = asyncHandler(async (req, res) => {
  try {
    const { department, semester, academicYear, type } = req.query;

    // Build query based on user role and filters
    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      
      query.department = student.department;
      query.semester = student.currentSemester;
      query.academicYear = student.currentAcademicYear;
      query.type = 'student';
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty) {
        return errorResponse(res, 'Faculty profile not found', 404);
      }
      
      // Faculty can see their department's timetable or their personal timetable
      if (department) {
        query.department = department;
      } else {
        query.department = faculty.department;
      }
    }

    // Apply additional filters
    if (department && req.user.role === 'admin') query.department = department;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (type) query.type = type;

    const timetables = await Timetable.find(query)
      .populate('department', 'name code')
      .populate('schedule.periods.course', 'name code credits')
      .populate('schedule.periods.faculty', 'firstName lastName')
      .sort({ academicYear: -1, semester: -1, type: 1 });

    // For faculty, filter to show only their classes if personal view
    if (req.user.role === 'faculty' && !department) {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty) {
        // Filter periods to show only those where this faculty is involved
        timetables.forEach(timetable => {
          Object.keys(timetable.schedule).forEach(day => {
            if (timetable.schedule[day] && timetable.schedule[day].periods) {
              timetable.schedule[day].periods = timetable.schedule[day].periods.filter(
                period => period.faculty && period.faculty._id.equals(faculty._id)
              );
            }
          });
        });
      }
    }

    logger.info(`Timetable fetched by user: ${req.user.id}`);
    return successResponse(res, 'Timetable retrieved successfully', timetables);

  } catch (error) {
    logger.error('Error fetching timetable:', error);
    return errorResponse(res, 'Failed to fetch timetable', 500);
  }
});

// @desc    Get timetable by ID
// @route   GET /api/timetable/:timetableId
// @access  Private (All authenticated users)
const getTimetableById = asyncHandler(async (req, res) => {
  try {
    const { timetableId } = req.params;

    const timetable = await Timetable.findById(timetableId)
      .populate('department', 'name code')
      .populate('schedule.periods.course', 'name code credits')
      .populate('schedule.periods.faculty', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!timetable) {
      return errorResponse(res, 'Timetable not found', 404);
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      hasAccess = student && 
                 timetable.department.equals(student.department) &&
                 timetable.semester === student.currentSemester;
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      hasAccess = faculty && timetable.department.equals(faculty.department);
    }

    if (!hasAccess) {
      return errorResponse(res, 'Access denied for this timetable', 403);
    }

    // Calculate statistics
    const stats = calculateTimetableStats(timetable);

    const timetableData = {
      timetable: timetable,
      statistics: stats
    };

    logger.info(`Timetable details fetched by user: ${req.user.id}, timetable: ${timetableId}`);
    return successResponse(res, 'Timetable details retrieved successfully', timetableData);

  } catch (error) {
    logger.error('Error fetching timetable details:', error);
    return errorResponse(res, 'Failed to fetch timetable details', 500);
  }
});

// @desc    Create new timetable
// @route   POST /api/timetable
// @access  Private (Admin, Faculty)
const createTimetable = asyncHandler(async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to create timetable', 403);
    }

    const {
      department,
      semester,
      academicYear,
      type,
      schedule,
      effectiveFrom,
      effectiveTo,
      description
    } = req.body;

    // Validate required fields
    if (!department || !semester || !academicYear || !type || !schedule) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Validate department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return errorResponse(res, 'Invalid department ID', 400);
    }

    // Check if active timetable already exists for this combination
    const existingTimetable = await Timetable.findOne({
      department,
      semester,
      academicYear,
      type,
      isActive: true
    });

    if (existingTimetable) {
      return errorResponse(res, 'Active timetable already exists for this combination', 400);
    }

    // Validate schedule structure and check for conflicts
    const validationResult = await validateSchedule(schedule);
    if (!validationResult.isValid) {
      return errorResponse(res, validationResult.error, 400);
    }

    const timetable = new Timetable({
      department,
      semester,
      academicYear,
      type,
      schedule,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      description,
      status: 'draft',
      isActive: false,
      createdBy: req.user.id
    });

    await timetable.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_TIMETABLE',
      resource: 'Timetable',
      resourceId: timetable._id,
      details: `Created timetable for ${departmentDoc.name} - Semester ${semester}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const newTimetable = await Timetable.findById(timetable._id)
      .populate('department', 'name code')
      .populate('schedule.periods.course', 'name code')
      .populate('schedule.periods.faculty', 'firstName lastName');

    logger.info(`Timetable created by user: ${req.user.id}, timetable: ${timetable._id}`);
    return successResponse(res, 'Timetable created successfully', newTimetable);

  } catch (error) {
    logger.error('Error creating timetable:', error);
    return errorResponse(res, 'Failed to create timetable', 500);
  }
});

// @desc    Update timetable
// @route   PUT /api/timetable/:timetableId
// @access  Private (Admin, Faculty)
const updateTimetable = asyncHandler(async (req, res) => {
  try {
    const { timetableId } = req.params;
    const updateData = req.body;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to update timetable', 403);
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return errorResponse(res, 'Timetable not found', 404);
    }

    // Faculty can only update timetables for their department
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || !timetable.department.equals(faculty.department)) {
        return errorResponse(res, 'Access denied for this timetable', 403);
      }
    }

    // If timetable is approved, only admin can update
    if (timetable.status === 'approved' && req.user.role !== 'admin') {
      return errorResponse(res, 'Cannot update approved timetable', 403);
    }

    // Validate schedule if being updated
    if (updateData.schedule) {
      const validationResult = await validateSchedule(updateData.schedule);
      if (!validationResult.isValid) {
        return errorResponse(res, validationResult.error, 400);
      }
    }

    // Update timetable fields
    const allowedFields = [
      'schedule', 'effectiveFrom', 'effectiveTo', 'description'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        timetable[field] = updateData[field];
      }
    });

    // Reset approval if schedule is modified
    if (updateData.schedule && timetable.status === 'approved') {
      timetable.status = 'pending_approval';
      timetable.approvedBy = null;
      timetable.approvedAt = null;
    }

    timetable.lastModifiedBy = req.user.id;
    timetable.lastModifiedAt = new Date();
    await timetable.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_TIMETABLE',
      resource: 'Timetable',
      resourceId: timetableId,
      details: `Updated timetable`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedTimetable = await Timetable.findById(timetableId)
      .populate('department', 'name code')
      .populate('schedule.periods.course', 'name code')
      .populate('schedule.periods.faculty', 'firstName lastName');

    logger.info(`Timetable updated by user: ${req.user.id}, timetable: ${timetableId}`);
    return successResponse(res, 'Timetable updated successfully', updatedTimetable);

  } catch (error) {
    logger.error('Error updating timetable:', error);
    return errorResponse(res, 'Failed to update timetable', 500);
  }
});

// @desc    Approve timetable
// @route   POST /api/timetable/:timetableId/approve
// @access  Private (Admin only)
const approveTimetable = asyncHandler(async (req, res) => {
  try {
    const { timetableId } = req.params;

    // Only admin can approve timetables
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only administrators can approve timetables', 403);
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return errorResponse(res, 'Timetable not found', 404);
    }

    if (timetable.status === 'approved') {
      return errorResponse(res, 'Timetable is already approved', 400);
    }

    // Deactivate any existing active timetable for the same combination
    await Timetable.updateMany(
      {
        department: timetable.department,
        semester: timetable.semester,
        academicYear: timetable.academicYear,
        type: timetable.type,
        isActive: true
      },
      {
        isActive: false,
        deactivatedBy: req.user.id,
        deactivatedAt: new Date()
      }
    );

    // Approve and activate the timetable
    timetable.status = 'approved';
    timetable.approvedBy = req.user.id;
    timetable.approvedAt = new Date();
    timetable.isActive = true;
    await timetable.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'APPROVE_TIMETABLE',
      resource: 'Timetable',
      resourceId: timetableId,
      details: `Approved and activated timetable`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const approvedTimetable = await Timetable.findById(timetableId)
      .populate('department', 'name code')
      .populate('approvedBy', 'firstName lastName');

    logger.info(`Timetable approved by admin: ${req.user.id}, timetable: ${timetableId}`);
    return successResponse(res, 'Timetable approved successfully', approvedTimetable);

  } catch (error) {
    logger.error('Error approving timetable:', error);
    return errorResponse(res, 'Failed to approve timetable', 500);
  }
});

// @desc    Get schedule conflicts
// @route   GET /api/timetable/conflicts
// @access  Private (Admin, Faculty)
const getConflicts = asyncHandler(async (req, res) => {
  try {
    const { department, semester, academicYear } = req.query;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to check conflicts', 403);
    }

    let query = {};
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const timetables = await Timetable.find({ ...query, isActive: true })
      .populate('schedule.periods.course', 'name code')
      .populate('schedule.periods.faculty', 'firstName lastName');

    const conflicts = await detectConflicts(timetables);

    logger.info(`Schedule conflicts checked by user: ${req.user.id}`);
    return successResponse(res, 'Schedule conflicts retrieved successfully', conflicts);

  } catch (error) {
    logger.error('Error checking schedule conflicts:', error);
    return errorResponse(res, 'Failed to check schedule conflicts', 500);
  }
});

// @desc    Export timetable
// @route   GET /api/timetable/:timetableId/export
// @access  Private (All authenticated users)
const exportTimetable = asyncHandler(async (req, res) => {
  try {
    const { timetableId } = req.params;
    const { format = 'json' } = req.query;

    const timetable = await Timetable.findById(timetableId)
      .populate('department', 'name code')
      .populate('schedule.periods.course', 'name code credits')
      .populate('schedule.periods.faculty', 'firstName lastName');

    if (!timetable) {
      return errorResponse(res, 'Timetable not found', 404);
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      hasAccess = student && timetable.department.equals(student.department);
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      hasAccess = faculty && timetable.department.equals(faculty.department);
    }

    if (!hasAccess) {
      return errorResponse(res, 'Access denied for this timetable', 403);
    }

    // Format data for export
    const exportData = formatTimetableForExport(timetable, format);

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'EXPORT_TIMETABLE',
      resource: 'Timetable',
      resourceId: timetableId,
      details: `Exported timetable in ${format} format`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Timetable exported by user: ${req.user.id}, timetable: ${timetableId}`);
    return successResponse(res, 'Timetable exported successfully', {
      format: format,
      exportedAt: new Date(),
      data: exportData
    });

  } catch (error) {
    logger.error('Error exporting timetable:', error);
    return errorResponse(res, 'Failed to export timetable', 500);
  }
});

// @desc    Get my schedule (for faculty)
// @route   GET /api/timetable/my-schedule
// @access  Private (Faculty)
const getMySchedule = asyncHandler(async (req, res) => {
  try {
    // Only faculty can use this endpoint
    if (req.user.role !== 'faculty') {
      return errorResponse(res, 'Only faculty can view personal schedule', 403);
    }

    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Get all active timetables where this faculty is involved
    const timetables = await Timetable.find({
      isActive: true,
      'schedule.periods.faculty': faculty._id
    })
    .populate('department', 'name code')
    .populate('schedule.periods.course', 'name code credits')
    .populate('schedule.periods.faculty', 'firstName lastName');

    // Extract only periods where this faculty is involved
    const mySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    timetables.forEach(timetable => {
      Object.keys(timetable.schedule).forEach(day => {
        if (timetable.schedule[day] && timetable.schedule[day].periods) {
          const myPeriods = timetable.schedule[day].periods.filter(
            period => period.faculty && period.faculty._id.equals(faculty._id)
          );
          
          myPeriods.forEach(period => {
            mySchedule[day].push({
              ...period.toObject(),
              department: timetable.department,
              semester: timetable.semester,
              academicYear: timetable.academicYear
            });
          });
        }
      });
    });

    // Sort periods by time for each day
    Object.keys(mySchedule).forEach(day => {
      mySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Calculate teaching load statistics
    const totalPeriods = Object.values(mySchedule).reduce(
      (total, dayPeriods) => total + dayPeriods.length, 0
    );

    const uniqueCourses = new Set();
    Object.values(mySchedule).forEach(dayPeriods => {
      dayPeriods.forEach(period => {
        if (period.course) {
          uniqueCourses.add(period.course._id.toString());
        }
      });
    });

    const scheduleData = {
      faculty: {
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        employeeId: faculty.employeeId,
        department: faculty.department.name
      },
      schedule: mySchedule,
      statistics: {
        totalPeriodsPerWeek: totalPeriods,
        uniqueCourses: uniqueCourses.size,
        averagePeriodsPerDay: (totalPeriods / 6).toFixed(1) // Excluding Sunday
      }
    };

    logger.info(`Personal schedule fetched by faculty: ${req.user.id}`);
    return successResponse(res, 'Personal schedule retrieved successfully', scheduleData);

  } catch (error) {
    logger.error('Error fetching personal schedule:', error);
    return errorResponse(res, 'Failed to fetch personal schedule', 500);
  }
});

// Helper function to validate schedule structure
const validateSchedule = async (schedule) => {
  try {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      if (schedule[day] && schedule[day].periods) {
        for (const period of schedule[day].periods) {
          // Validate required fields
          if (!period.startTime || !period.endTime) {
            return { isValid: false, error: `Missing time information for ${day}` };
          }

          // Validate course exists
          if (period.course) {
            const course = await Course.findById(period.course);
            if (!course) {
              return { isValid: false, error: `Invalid course ID in ${day} schedule` };
            }
          }

          // Validate faculty exists
          if (period.faculty) {
            const faculty = await Faculty.findById(period.faculty);
            if (!faculty) {
              return { isValid: false, error: `Invalid faculty ID in ${day} schedule` };
            }
          }

          // Validate time format (HH:MM)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(period.startTime) || !timeRegex.test(period.endTime)) {
            return { isValid: false, error: `Invalid time format in ${day} schedule` };
          }

          // Check if start time is before end time
          if (period.startTime >= period.endTime) {
            return { isValid: false, error: `Start time must be before end time in ${day} schedule` };
          }
        }

        // Check for time overlaps within the same day
        const sortedPeriods = schedule[day].periods.sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        );

        for (let i = 0; i < sortedPeriods.length - 1; i++) {
          if (sortedPeriods[i].endTime > sortedPeriods[i + 1].startTime) {
            return { isValid: false, error: `Time overlap detected in ${day} schedule` };
          }
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Schedule validation failed' };
  }
};

// Helper function to detect conflicts
const detectConflicts = async (timetables) => {
  const conflicts = [];
  
  // Check for faculty conflicts (same faculty in multiple places at same time)
  const facultySchedule = {};
  
  timetables.forEach(timetable => {
    Object.keys(timetable.schedule).forEach(day => {
      if (timetable.schedule[day] && timetable.schedule[day].periods) {
        timetable.schedule[day].periods.forEach(period => {
          if (period.faculty) {
            const facultyId = period.faculty._id.toString();
            const timeSlot = `${day}-${period.startTime}-${period.endTime}`;
            
            if (!facultySchedule[facultyId]) {
              facultySchedule[facultyId] = {};
            }
            
            if (facultySchedule[facultyId][timeSlot]) {
              conflicts.push({
                type: 'faculty_conflict',
                faculty: period.faculty,
                timeSlot: timeSlot,
                conflictingTimetables: [
                  facultySchedule[facultyId][timeSlot].timetableId,
                  timetable._id
                ]
              });
            } else {
              facultySchedule[facultyId][timeSlot] = {
                timetableId: timetable._id,
                period: period
              };
            }
          }
        });
      }
    });
  });

  return conflicts;
};

// Helper function to calculate timetable statistics
const calculateTimetableStats = (timetable) => {
  let totalPeriods = 0;
  let uniqueCourses = new Set();
  let uniqueFaculty = new Set();

  Object.keys(timetable.schedule).forEach(day => {
    if (timetable.schedule[day] && timetable.schedule[day].periods) {
      totalPeriods += timetable.schedule[day].periods.length;
      
      timetable.schedule[day].periods.forEach(period => {
        if (period.course) uniqueCourses.add(period.course._id.toString());
        if (period.faculty) uniqueFaculty.add(period.faculty._id.toString());
      });
    }
  });

  return {
    totalPeriods,
    uniqueCourses: uniqueCourses.size,
    uniqueFaculty: uniqueFaculty.size,
    averagePeriodsPerDay: (totalPeriods / 6).toFixed(1) // Excluding Sunday
  };
};

// Helper function to format timetable for export
const formatTimetableForExport = (timetable, format) => {
  if (format === 'csv') {
    // Format as CSV-like structure
    const csvData = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => {
      if (timetable.schedule[day] && timetable.schedule[day].periods) {
        timetable.schedule[day].periods.forEach(period => {
          csvData.push({
            Day: day,
            StartTime: period.startTime,
            EndTime: period.endTime,
            Course: period.course ? `${period.course.code} - ${period.course.name}` : '',
            Faculty: period.faculty ? `${period.faculty.firstName} ${period.faculty.lastName}` : '',
            Room: period.room || '',
            Type: period.type || ''
          });
        });
      }
    });
    
    return csvData;
  } else {
    // Return JSON format
    return timetable;
  }
};

module.exports = {
  getTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  approveTimetable,
  getConflicts,
  exportTimetable,
  getMySchedule
};