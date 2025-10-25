// server/controllers/facultyController.js

const asyncHandler = require('../utils/asyncHandler');
const { Faculty, User, Course, Student, Enrollment, Attendance, Department, Notice, Timetable } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard
// @access  Private (Faculty)
const getDashboard = asyncHandler(async (req, res) => {
  const facultyId = req.user.id;

  try {
    // Get faculty profile
    const faculty = await Faculty.findOne({ user: facultyId })
      .populate('user', 'firstName lastName email')
      .populate('department', 'name code');

    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Get courses where faculty is coordinator or instructor
    const coordinatingCourses = await Course.find({ 
      'faculty.coordinator': faculty._id 
    }).populate('department', 'name');

    const instructingCourses = await Course.find({ 
      'faculty.instructors': faculty._id 
    }).populate('department', 'name');

    // Get total students under faculty
    const allCourses = [...coordinatingCourses, ...instructingCourses];
    const uniqueCourseIds = [...new Set(allCourses.map(course => course._id.toString()))];
    
    const totalStudents = await Enrollment.countDocuments({
      course: { $in: uniqueCourseIds },
      status: 'active'
    });

    // Get today's classes
    const today = new Date();
    const dayOfWeek = today.toLocaleLowerCase().slice(0, 3); // mon, tue, etc.
    
    const todaysTimetable = await Timetable.find({
      department: faculty.department,
      isActive: true,
      [`schedule.${dayOfWeek}.periods.faculty`]: faculty._id
    })
    .populate('schedule.periods.course', 'name code')
    .populate('schedule.periods.faculty', 'firstName lastName');

    // Get recent attendance marked by faculty
    const recentAttendance = await Attendance.find({
      faculty: faculty._id,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .populate('course', 'name')
    .populate('student', 'rollNumber')
    .sort({ date: -1 })
    .limit(10);

    // Get pending grade submissions
    const pendingGrades = await Enrollment.find({
      course: { $in: uniqueCourseIds },
      grade: { $exists: false }
    })
    .populate('course', 'name code')
    .populate('student', 'rollNumber user')
    .populate('student.user', 'firstName lastName');

    // Get notices published by faculty
    const recentNotices = await Notice.find({
      publishedBy: req.user.id
    })
    .sort({ createdAt: -1 })
    .limit(5);

    const dashboardData = {
      profile: {
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        employeeId: faculty.employeeId,
        department: faculty.department.name,
        designation: faculty.designation,
        experience: faculty.experience
      },
      stats: {
        coordinatingCourses: coordinatingCourses.length,
        instructingCourses: instructingCourses.length,
        totalStudents: totalStudents,
        todaysClasses: todaysTimetable.length,
        pendingGrades: pendingGrades.length
      },
      todaysSchedule: todaysTimetable,
      recentActivity: {
        attendance: recentAttendance,
        notices: recentNotices
      }
    };

    logger.info(`Dashboard data fetched for faculty: ${facultyId}`);
    return successResponse(res, 'Dashboard data retrieved successfully', dashboardData);

  } catch (error) {
    logger.error('Error fetching faculty dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
});

// @desc    Get faculty profile
// @route   GET /api/faculty/profile
// @access  Private (Faculty)
const getProfile = asyncHandler(async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id })
      .populate('user', '-password -refreshToken')
      .populate('department', 'name code');

    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    logger.info(`Profile fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Profile retrieved successfully', faculty);

  } catch (error) {
    logger.error('Error fetching faculty profile:', error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
});

// @desc    Update faculty profile
// @route   PUT /api/faculty/profile
// @access  Private (Faculty)
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { 
      phone, 
      address, 
      emergencyContact, 
      qualifications,
      specialization,
      researchInterests,
      publications,
      officeHours
    } = req.body;

    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Update faculty fields
    if (phone) faculty.phone = phone;
    if (address) faculty.address = address;
    if (emergencyContact) faculty.emergencyContact = emergencyContact;
    if (qualifications) faculty.qualifications = qualifications;
    if (specialization) faculty.specialization = specialization;
    if (researchInterests) faculty.researchInterests = researchInterests;
    if (publications) faculty.publications = publications;
    if (officeHours) faculty.officeHours = officeHours;

    await faculty.save();

    const updatedFaculty = await Faculty.findById(faculty._id)
      .populate('user', '-password -refreshToken')
      .populate('department', 'name code');

    logger.info(`Profile updated for faculty: ${req.user.id}`);
    return successResponse(res, 'Profile updated successfully', updatedFaculty);

  } catch (error) {
    logger.error('Error updating faculty profile:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
});

// @desc    Get faculty classes
// @route   GET /api/faculty/classes
// @access  Private (Faculty)
const getClasses = asyncHandler(async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Get courses where faculty is coordinator
    const coordinatingCourses = await Course.find({ 
      'faculty.coordinator': faculty._id 
    })
    .populate('department', 'name code')
    .populate('faculty.instructors', 'firstName lastName');

    // Get courses where faculty is instructor
    const instructingCourses = await Course.find({ 
      'faculty.instructors': faculty._id 
    })
    .populate('department', 'name code')
    .populate('faculty.coordinator', 'firstName lastName')
    .populate('faculty.instructors', 'firstName lastName');

    // Get enrollment count for each course
    const allCourses = [...coordinatingCourses, ...instructingCourses];
    const coursesWithEnrollment = await Promise.all(
      allCourses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
          status: 'active'
        });
        
        return {
          ...course.toObject(),
          enrollmentCount,
          role: coordinatingCourses.some(c => c._id.equals(course._id)) ? 'coordinator' : 'instructor'
        };
      })
    );

    logger.info(`Classes fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Classes retrieved successfully', coursesWithEnrollment);

  } catch (error) {
    logger.error('Error fetching faculty classes:', error);
    return errorResponse(res, 'Failed to fetch classes', 500);
  }
});

// @desc    Get students in faculty courses
// @route   GET /api/faculty/students
// @access  Private (Faculty)
const getStudents = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.query;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    let courseQuery = {
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    };

    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery);
    const courseIds = courses.map(course => course._id);

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: 'active'
    })
    .populate('student', 'rollNumber studentId user')
    .populate('student.user', 'firstName lastName email')
    .populate('course', 'name code')
    .sort({ 'student.rollNumber': 1 });

    // Group students by course if no specific course requested
    let studentsData;
    if (courseId) {
      studentsData = enrollments;
    } else {
      studentsData = enrollments.reduce((acc, enrollment) => {
        const courseId = enrollment.course._id.toString();
        if (!acc[courseId]) {
          acc[courseId] = {
            course: enrollment.course,
            students: []
          };
        }
        acc[courseId].students.push(enrollment);
        return acc;
      }, {});
      studentsData = Object.values(studentsData);
    }

    logger.info(`Students fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Students retrieved successfully', studentsData);

  } catch (error) {
    logger.error('Error fetching faculty students:', error);
    return errorResponse(res, 'Failed to fetch students', 500);
  }
});

// @desc    Get course details
// @route   GET /api/faculty/courses/:courseId
// @access  Private (Faculty)
const getCourseDetails = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    const course = await Course.findOne({
      _id: courseId,
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    })
    .populate('department', 'name code')
    .populate('faculty.coordinator', 'firstName lastName')
    .populate('faculty.instructors', 'firstName lastName');

    if (!course) {
      return errorResponse(res, 'Course not found or access denied', 404);
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'active'
    })
    .populate('student', 'rollNumber studentId user')
    .populate('student.user', 'firstName lastName email');

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$student',
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      }
    ]);

    const courseDetails = {
      course: course,
      enrollments: enrollments,
      statistics: {
        totalStudents: enrollments.length,
        totalClasses: attendanceStats.reduce((sum, stat) => Math.max(sum, stat.totalClasses), 0),
        averageAttendance: attendanceStats.length > 0 ? 
          (attendanceStats.reduce((sum, stat) => sum + (stat.presentClasses / stat.totalClasses), 0) / attendanceStats.length * 100).toFixed(1) : 0
      },
      attendanceStats: attendanceStats
    };

    logger.info(`Course details fetched for faculty: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course details retrieved successfully', courseDetails);

  } catch (error) {
    logger.error('Error fetching course details:', error);
    return errorResponse(res, 'Failed to fetch course details', 500);
  }
});

// @desc    Mark attendance
// @route   POST /api/faculty/attendance/mark
// @access  Private (Faculty)
const markAttendance = asyncHandler(async (req, res) => {
  try {
    const { courseId, date, period, attendanceData } = req.body;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Verify faculty has access to this course
    const course = await Course.findOne({
      _id: courseId,
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    });

    if (!course) {
      return errorResponse(res, 'Course not found or access denied', 404);
    }

    // Validate date
    const attendanceDate = new Date(date);
    if (attendanceDate > new Date()) {
      return errorResponse(res, 'Cannot mark attendance for future dates', 400);
    }

    // Process attendance data
    const attendanceRecords = [];
    for (const record of attendanceData) {
      const { studentId, status } = record;
      
      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        course: courseId,
        date: attendanceDate,
        period: period
      });

      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = status;
        existingAttendance.markedBy = faculty._id;
        existingAttendance.markedAt = new Date();
        await existingAttendance.save();
        attendanceRecords.push(existingAttendance);
      } else {
        // Create new record
        const newAttendance = new Attendance({
          student: studentId,
          course: courseId,
          faculty: faculty._id,
          date: attendanceDate,
          period: period,
          status: status,
          markedBy: faculty._id,
          markedAt: new Date(),
          academicYear: course.academicYear,
          semester: course.semester
        });
        await newAttendance.save();
        attendanceRecords.push(newAttendance);
      }
    }

    logger.info(`Attendance marked by faculty: ${req.user.id}, course: ${courseId}, date: ${date}`);
    return successResponse(res, 'Attendance marked successfully', {
      course: course.name,
      date: attendanceDate,
      period: period,
      recordsProcessed: attendanceRecords.length
    });

  } catch (error) {
    logger.error('Error marking attendance:', error);
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
});

// @desc    Get attendance report
// @route   GET /api/faculty/attendance/report
// @access  Private (Faculty)
const getAttendanceReport = asyncHandler(async (req, res) => {
  try {
    const { courseId, fromDate, toDate } = req.query;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    let query = {
      faculty: faculty._id
    };

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
      .sort({ date: -1, period: 1 });

    // Generate summary statistics
    const summary = attendanceRecords.reduce((acc, record) => {
      const studentId = record.student._id.toString();
      const courseId = record.course._id.toString();
      
      if (!acc[courseId]) {
        acc[courseId] = {
          course: record.course,
          students: {}
        };
      }
      
      if (!acc[courseId].students[studentId]) {
        acc[courseId].students[studentId] = {
          student: record.student,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0
        };
      }
      
      acc[courseId].students[studentId].total++;
      acc[courseId].students[studentId][record.status]++;
      
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(summary).forEach(courseId => {
      Object.keys(summary[courseId].students).forEach(studentId => {
        const studentData = summary[courseId].students[studentId];
        studentData.percentage = studentData.total > 0 ? 
          ((studentData.present / studentData.total) * 100).toFixed(1) : 0;
      });
      summary[courseId].students = Object.values(summary[courseId].students);
    });

    const reportData = {
      records: attendanceRecords,
      summary: Object.values(summary),
      totalRecords: attendanceRecords.length
    };

    logger.info(`Attendance report fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Attendance report retrieved successfully', reportData);

  } catch (error) {
    logger.error('Error fetching attendance report:', error);
    return errorResponse(res, 'Failed to fetch attendance report', 500);
  }
});

// @desc    Submit grades
// @route   POST /api/faculty/grades/submit
// @access  Private (Faculty)
const submitGrades = asyncHandler(async (req, res) => {
  try {
    const { courseId, grades } = req.body;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Verify faculty has access to this course
    const course = await Course.findOne({
      _id: courseId,
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    });

    if (!course) {
      return errorResponse(res, 'Course not found or access denied', 404);
    }

    const gradingResults = [];
    for (const gradeData of grades) {
      const { 
        enrollmentId, 
        internalMarks, 
        externalMarks, 
        totalMarks, 
        grade, 
        gradePoint 
      } = gradeData;

      const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        course: courseId
      });

      if (enrollment) {
        enrollment.internalMarks = internalMarks;
        enrollment.externalMarks = externalMarks;
        enrollment.totalMarks = totalMarks;
        enrollment.grade = grade;
        enrollment.gradePoint = gradePoint;
        enrollment.gradesSubmittedBy = faculty._id;
        enrollment.gradesSubmittedAt = new Date();
        
        await enrollment.save();
        gradingResults.push(enrollment);
      }
    }

    logger.info(`Grades submitted by faculty: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Grades submitted successfully', {
      course: course.name,
      gradesSubmitted: gradingResults.length
    });

  } catch (error) {
    logger.error('Error submitting grades:', error);
    return errorResponse(res, 'Failed to submit grades', 500);
  }
});

// @desc    Get grade history
// @route   GET /api/faculty/grades/history
// @access  Private (Faculty)
const getGradeHistory = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.query;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    let courseQuery = {
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    };

    if (courseId) courseQuery._id = courseId;

    const courses = await Course.find(courseQuery);
    const courseIds = courses.map(course => course._id);

    const gradeHistory = await Enrollment.find({
      course: { $in: courseIds },
      grade: { $exists: true },
      gradesSubmittedBy: faculty._id
    })
    .populate('student', 'rollNumber studentId user')
    .populate('student.user', 'firstName lastName')
    .populate('course', 'name code')
    .sort({ gradesSubmittedAt: -1 });

    logger.info(`Grade history fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Grade history retrieved successfully', gradeHistory);

  } catch (error) {
    logger.error('Error fetching grade history:', error);
    return errorResponse(res, 'Failed to fetch grade history', 500);
  }
});

// @desc    Get faculty timetable
// @route   GET /api/faculty/timetable
// @access  Private (Faculty)
const getTimetable = asyncHandler(async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    const timetables = await Timetable.find({
      'schedule.periods.faculty': faculty._id,
      isActive: true
    })
    .populate('department', 'name code')
    .populate('schedule.periods.course', 'name code')
    .populate('schedule.periods.faculty', 'firstName lastName');

    logger.info(`Timetable fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Timetable retrieved successfully', timetables);

  } catch (error) {
    logger.error('Error fetching faculty timetable:', error);
    return errorResponse(res, 'Failed to fetch timetable', 500);
  }
});

// @desc    Get faculty notices
// @route   GET /api/faculty/notices
// @access  Private (Faculty)
const getNotices = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    const notices = await Notice.find({
      $or: [
        { targetRoles: 'faculty' },
        { targetRoles: 'all' },
        { targetDepartments: faculty.department }
      ],
      isActive: true
    })
    .populate('publishedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Notice.countDocuments({
      $or: [
        { targetRoles: 'faculty' },
        { targetRoles: 'all' },
        { targetDepartments: faculty.department }
      ],
      isActive: true
    });

    const noticeData = {
      notices: notices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotices: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Notices fetched for faculty: ${req.user.id}`);
    return successResponse(res, 'Notices retrieved successfully', noticeData);

  } catch (error) {
    logger.error('Error fetching faculty notices:', error);
    return errorResponse(res, 'Failed to fetch notices', 500);
  }
});

// @desc    Upload course material
// @route   POST /api/faculty/upload-material
// @access  Private (Faculty)
const uploadMaterial = asyncHandler(async (req, res) => {
  try {
    const { courseId, title, description, materialType, fileUrl } = req.body;
    
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return errorResponse(res, 'Faculty profile not found', 404);
    }

    // Verify faculty has access to this course
    const course = await Course.findOne({
      _id: courseId,
      $or: [
        { 'faculty.coordinator': faculty._id },
        { 'faculty.instructors': faculty._id }
      ]
    });

    if (!course) {
      return errorResponse(res, 'Course not found or access denied', 404);
    }

    // Add material to course
    const material = {
      title,
      description,
      type: materialType,
      url: fileUrl,
      uploadedBy: faculty._id,
      uploadedAt: new Date()
    };

    course.materials = course.materials || [];
    course.materials.push(material);
    await course.save();

    logger.info(`Material uploaded by faculty: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Material uploaded successfully', material);

  } catch (error) {
    logger.error('Error uploading material:', error);
    return errorResponse(res, 'Failed to upload material', 500);
  }
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getClasses,
  getStudents,
  getCourseDetails,
  markAttendance,
  getAttendanceReport,
  submitGrades,
  getGradeHistory,
  getTimetable,
  getNotices,
  uploadMaterial
};