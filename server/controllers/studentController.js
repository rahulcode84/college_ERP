// server/controllers/studentController.js

const asyncHandler = require('../utils/asyncHandler');
const { Student, User, Enrollment, Attendance, Fee, BorrowRecord, Notice, Timetable, Course } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  try {
    // Get student profile
    const student = await Student.findOne({ user: studentId })
      .populate('user', 'firstName lastName email')
      .populate('department', 'name code');

    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    // Get current enrollments
    const enrollments = await Enrollment.find({ 
      student: student._id, 
      status: 'active' 
    }).populate('course', 'name code credits');

    // Get recent attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendance = await Attendance.find({
      student: student._id,
      date: { $gte: thirtyDaysAgo }
    }).populate('course', 'name');

    // Calculate attendance percentage
    const totalClasses = recentAttendance.length;
    const presentClasses = recentAttendance.filter(att => att.status === 'present').length;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 0;

    // Get pending fees
    const pendingFees = await Fee.find({
      student: student._id,
      status: 'pending'
    });

    const totalPendingAmount = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);

    // Get recent notices (last 10)
    const recentNotices = await Notice.find({
      $or: [
        { targetRoles: 'student' },
        { targetDepartments: student.department },
        { targetRoles: 'all' }
      ],
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('publishedBy', 'firstName lastName');

    // Get current semester CGPA
    const currentSemesterGrades = await Enrollment.find({
      student: student._id,
      academicYear: student.currentAcademicYear,
      semester: student.currentSemester
    }).select('grade gradePoint credits');

    let currentCGPA = 0;
    if (currentSemesterGrades.length > 0) {
      const totalCredits = currentSemesterGrades.reduce((sum, enrollment) => sum + enrollment.credits, 0);
      const weightedGradePoints = currentSemesterGrades.reduce((sum, enrollment) => 
        sum + (enrollment.gradePoint * enrollment.credits), 0);
      currentCGPA = totalCredits > 0 ? (weightedGradePoints / totalCredits).toFixed(2) : 0;
    }

    // Get library books
    const borrowedBooks = await BorrowRecord.find({
      student: student._id,
      status: 'borrowed'
    }).populate('book', 'title author');

    const dashboardData = {
      profile: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        department: student.department.name,
        semester: student.currentSemester,
        cgpa: student.cgpa || currentCGPA
      },
      stats: {
        enrolledCourses: enrollments.length,
        attendancePercentage: parseFloat(attendancePercentage),
        pendingFees: totalPendingAmount,
        borrowedBooks: borrowedBooks.length
      },
      recentActivity: {
        notices: recentNotices.slice(0, 5),
        attendance: recentAttendance.slice(-5),
        enrollments: enrollments
      }
    };

    logger.info(`Dashboard data fetched for student: ${studentId}`);
    return successResponse(res, 'Dashboard data retrieved successfully', dashboardData);

  } catch (error) {
    logger.error('Error fetching student dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
});

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student)
const getProfile = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', '-password -refreshToken')
      .populate('department', 'name code')
      .populate('batch', 'name year');

    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    logger.info(`Profile fetched for student: ${req.user.id}`);
    return successResponse(res, 'Profile retrieved successfully', student);

  } catch (error) {
    logger.error('Error fetching student profile:', error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
});

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student)
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { 
      phone, 
      address, 
      emergencyContact, 
      bloodGroup, 
      dateOfBirth,
      guardianInfo 
    } = req.body;

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    // Update student fields
    if (phone) student.phone = phone;
    if (address) student.address = address;
    if (emergencyContact) student.emergencyContact = emergencyContact;
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (guardianInfo) student.guardianInfo = guardianInfo;

    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate('user', '-password -refreshToken')
      .populate('department', 'name code');

    logger.info(`Profile updated for student: ${req.user.id}`);
    return successResponse(res, 'Profile updated successfully', updatedStudent);

  } catch (error) {
    logger.error('Error updating student profile:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
});

// @desc    Get student grades
// @route   GET /api/student/grades
// @access  Private (Student)
const getGrades = asyncHandler(async (req, res) => {
  try {
    const { semester, academicYear } = req.query;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    let query = { student: student._id };
    
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const enrollments = await Enrollment.find(query)
      .populate('course', 'name code credits')
      .sort({ academicYear: -1, semester: -1 });

    // Group by academic year and semester
    const gradesByTerm = enrollments.reduce((acc, enrollment) => {
      const key = `${enrollment.academicYear}-${enrollment.semester}`;
      if (!acc[key]) {
        acc[key] = {
          academicYear: enrollment.academicYear,
          semester: enrollment.semester,
          courses: [],
          totalCredits: 0,
          totalGradePoints: 0,
          sgpa: 0
        };
      }
      
      acc[key].courses.push({
        course: enrollment.course,
        grade: enrollment.grade,
        gradePoint: enrollment.gradePoint,
        internalMarks: enrollment.internalMarks,
        externalMarks: enrollment.externalMarks,
        totalMarks: enrollment.totalMarks
      });
      
      acc[key].totalCredits += enrollment.course.credits;
      acc[key].totalGradePoints += (enrollment.gradePoint * enrollment.course.credits);
      
      return acc;
    }, {});

    // Calculate SGPA for each term
    Object.keys(gradesByTerm).forEach(key => {
      const term = gradesByTerm[key];
      term.sgpa = term.totalCredits > 0 ? 
        (term.totalGradePoints / term.totalCredits).toFixed(2) : 0;
    });

    const gradesData = {
      overall: {
        cgpa: student.cgpa || 0,
        totalCreditsEarned: student.totalCreditsEarned || 0
      },
      termWise: Object.values(gradesByTerm)
    };

    logger.info(`Grades fetched for student: ${req.user.id}`);
    return successResponse(res, 'Grades retrieved successfully', gradesData);

  } catch (error) {
    logger.error('Error fetching student grades:', error);
    return errorResponse(res, 'Failed to fetch grades', 500);
  }
});

// @desc    Get student attendance
// @route   GET /api/student/attendance
// @access  Private (Student)
const getAttendance = asyncHandler(async (req, res) => {
  try {
    const { courseId, fromDate, toDate } = req.query;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    let query = { student: student._id };
    
    if (courseId) query.course = courseId;
    if (fromDate && toDate) {
      query.date = { 
        $gte: new Date(fromDate), 
        $lte: new Date(toDate) 
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('faculty', 'firstName lastName')
      .sort({ date: -1, period: 1 });

    // Calculate attendance statistics
    const stats = attendanceRecords.reduce((acc, record) => {
      const courseId = record.course._id.toString();
      
      if (!acc[courseId]) {
        acc[courseId] = {
          course: record.course,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0
        };
      }
      
      acc[courseId].total++;
      acc[courseId][record.status]++;
      
      return acc;
    }, {});

    // Calculate percentages
    Object.keys(stats).forEach(courseId => {
      const courseStat = stats[courseId];
      courseStat.percentage = courseStat.total > 0 ? 
        ((courseStat.present / courseStat.total) * 100).toFixed(1) : 0;
    });

    const attendanceData = {
      records: attendanceRecords,
      statistics: Object.values(stats),
      summary: {
        totalClasses: attendanceRecords.length,
        presentClasses: attendanceRecords.filter(r => r.status === 'present').length,
        overallPercentage: attendanceRecords.length > 0 ? 
          ((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100).toFixed(1) : 0
      }
    };

    logger.info(`Attendance fetched for student: ${req.user.id}`);
    return successResponse(res, 'Attendance retrieved successfully', attendanceData);

  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    return errorResponse(res, 'Failed to fetch attendance', 500);
  }
});

// @desc    Get student enrollments
// @route   GET /api/student/enrollments
// @access  Private (Student)
const getEnrollments = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const enrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'name code credits description syllabus')
      .populate('course.faculty.coordinator', 'firstName lastName')
      .populate('course.faculty.instructors', 'firstName lastName')
      .sort({ academicYear: -1, semester: -1 });

    logger.info(`Enrollments fetched for student: ${req.user.id}`);
    return successResponse(res, 'Enrollments retrieved successfully', enrollments);

  } catch (error) {
    logger.error('Error fetching student enrollments:', error);
    return errorResponse(res, 'Failed to fetch enrollments', 500);
  }
});

// @desc    Get student academic history
// @route   GET /api/student/academic-history
// @access  Private (Student)
const getAcademicHistory = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('department', 'name code');
    
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const enrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'name code credits')
      .sort({ academicYear: 1, semester: 1 });

    // Group by academic year and semester for transcript
    const transcript = enrollments.reduce((acc, enrollment) => {
      const key = `${enrollment.academicYear}-S${enrollment.semester}`;
      if (!acc[key]) {
        acc[key] = {
          academicYear: enrollment.academicYear,
          semester: enrollment.semester,
          courses: [],
          semesterCredits: 0,
          semesterGradePoints: 0,
          sgpa: 0
        };
      }
      
      acc[key].courses.push({
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
        credits: enrollment.course.credits,
        grade: enrollment.grade,
        gradePoint: enrollment.gradePoint
      });
      
      acc[key].semesterCredits += enrollment.course.credits;
      acc[key].semesterGradePoints += (enrollment.gradePoint * enrollment.course.credits);
      
      return acc;
    }, {});

    // Calculate SGPA for each semester
    Object.keys(transcript).forEach(key => {
      const semester = transcript[key];
      semester.sgpa = semester.semesterCredits > 0 ? 
        (semester.semesterGradePoints / semester.semesterCredits).toFixed(2) : 0;
    });

    const academicHistory = {
      studentInfo: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        department: student.department.name,
        admissionDate: student.admissionDate,
        currentSemester: student.currentSemester,
        cgpa: student.cgpa
      },
      transcript: Object.values(transcript),
      summary: {
        totalCreditsEarned: student.totalCreditsEarned || 0,
        cgpa: student.cgpa || 0,
        academicStatus: student.academicStatus || 'Active'
      }
    };

    logger.info(`Academic history fetched for student: ${req.user.id}`);
    return successResponse(res, 'Academic history retrieved successfully', academicHistory);

  } catch (error) {
    logger.error('Error fetching academic history:', error);
    return errorResponse(res, 'Failed to fetch academic history', 500);
  }
});

// @desc    Get student fees
// @route   GET /api/student/fees
// @access  Private (Student)
const getFees = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const fees = await Fee.find({ student: student._id })
      .sort({ dueDate: -1 });

    // Calculate fee summary
    const summary = fees.reduce((acc, fee) => {
      acc.total += fee.amount;
      acc[fee.status] = (acc[fee.status] || 0) + fee.amount;
      return acc;
    }, { total: 0, pending: 0, paid: 0, overdue: 0 });

    // Get overdue fees
    const currentDate = new Date();
    const overdueFees = fees.filter(fee => 
      fee.status === 'pending' && new Date(fee.dueDate) < currentDate
    );

    const feeData = {
      fees: fees,
      summary: summary,
      overdueFees: overdueFees,
      statistics: {
        totalFees: fees.length,
        pendingCount: fees.filter(f => f.status === 'pending').length,
        paidCount: fees.filter(f => f.status === 'paid').length,
        overdueCount: overdueFees.length
      }
    };

    logger.info(`Fees fetched for student: ${req.user.id}`);
    return successResponse(res, 'Fees retrieved successfully', feeData);

  } catch (error) {
    logger.error('Error fetching student fees:', error);
    return errorResponse(res, 'Failed to fetch fees', 500);
  }
});

// @desc    Get payment history
// @route   GET /api/student/payment-history
// @access  Private (Student)
const getPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const payments = await Fee.find({ 
      student: student._id, 
      status: 'paid' 
    }).sort({ paymentDate: -1 });

    logger.info(`Payment history fetched for student: ${req.user.id}`);
    return successResponse(res, 'Payment history retrieved successfully', payments);

  } catch (error) {
    logger.error('Error fetching payment history:', error);
    return errorResponse(res, 'Failed to fetch payment history', 500);
  }
});

// @desc    Get library books
// @route   GET /api/student/library-books
// @access  Private (Student)
const getLibraryBooks = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const borrowedBooks = await BorrowRecord.find({ student: student._id })
      .populate('book', 'title author isbn publisher category')
      .sort({ borrowDate: -1 });

    // Separate current and history
    const currentBooks = borrowedBooks.filter(record => record.status === 'borrowed');
    const history = borrowedBooks.filter(record => record.status !== 'borrowed');

    const libraryData = {
      currentBooks: currentBooks,
      history: history,
      statistics: {
        totalBorrowed: borrowedBooks.length,
        currentlyBorrowed: currentBooks.length,
        returned: history.filter(h => h.status === 'returned').length,
        overdue: currentBooks.filter(book => 
          new Date(book.dueDate) < new Date()
        ).length
      }
    };

    logger.info(`Library books fetched for student: ${req.user.id}`);
    return successResponse(res, 'Library books retrieved successfully', libraryData);

  } catch (error) {
    logger.error('Error fetching library books:', error);
    return errorResponse(res, 'Failed to fetch library books', 500);
  }
});

// @desc    Get student notices
// @route   GET /api/student/notices
// @access  Private (Student)
const getNotices = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const notices = await Notice.find({
      $or: [
        { targetRoles: 'student' },
        { targetRoles: 'all' },
        { targetDepartments: student.department }
      ],
      isActive: true
    })
    .populate('publishedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Notice.countDocuments({
      $or: [
        { targetRoles: 'student' },
        { targetRoles: 'all' },
        { targetDepartments: student.department }
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

    logger.info(`Notices fetched for student: ${req.user.id}`);
    return successResponse(res, 'Notices retrieved successfully', noticeData);

  } catch (error) {
    logger.error('Error fetching student notices:', error);
    return errorResponse(res, 'Failed to fetch notices', 500);
  }
});

// @desc    Get student timetable
// @route   GET /api/student/timetable
// @access  Private (Student)
const getTimetable = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return errorResponse(res, 'Student profile not found', 404);
    }

    const timetable = await Timetable.findOne({
      department: student.department,
      semester: student.currentSemester,
      academicYear: student.currentAcademicYear,
      isActive: true
    })
    .populate('schedule.periods.course', 'name code')
    .populate('schedule.periods.faculty', 'firstName lastName');

    if (!timetable) {
      return successResponse(res, 'No timetable found', null);
    }

    logger.info(`Timetable fetched for student: ${req.user.id}`);
    return successResponse(res, 'Timetable retrieved successfully', timetable);

  } catch (error) {
    logger.error('Error fetching student timetable:', error);
    return errorResponse(res, 'Failed to fetch timetable', 500);
  }
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getGrades,
  getAttendance,
  getEnrollments,
  getAcademicHistory,
  getFees,
  getPaymentHistory,
  getLibraryBooks,
  getNotices,
  getTimetable
};