// server/controllers/courseController.js

const asyncHandler = require('../utils/asyncHandler');
const { Course, Department, Faculty, Student, Enrollment, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get all courses with filtering
// @route   GET /api/courses
// @access  Private (All authenticated users)
const getCourses = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      department, 
      semester, 
      academicYear,
      search,
      status = 'active'
    } = req.query;

    // Build query
    let query = {};
    
    if (department && department !== 'all') query.department = department;
    if (semester && semester !== 'all') query.semester = semester;
    if (academicYear && academicYear !== 'all') query.academicYear = academicYear;
    if (status && status !== 'all') query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('faculty.coordinator', 'firstName lastName')
      .populate('faculty.instructors', 'firstName lastName')
      .sort({ department: 1, semester: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    // Get enrollment count for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
          status: 'active'
        });
        
        return {
          ...course.toObject(),
          enrollmentCount
        };
      })
    );

    const courseData = {
      courses: coursesWithEnrollment,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCourses: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Courses list fetched by user: ${req.user.id}`);
    return successResponse(res, 'Courses retrieved successfully', courseData);

  } catch (error) {
    logger.error('Error fetching courses:', error);
    return errorResponse(res, 'Failed to fetch courses', 500);
  }
});

// @desc    Get single course details
// @route   GET /api/courses/:courseId
// @access  Private (All authenticated users)
const getCourseDetails = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('department', 'name code')
      .populate('faculty.coordinator', 'firstName lastName email')
      .populate('faculty.instructors', 'firstName lastName email')
      .populate('prerequisites', 'name code');

    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Get enrollment statistics
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get current enrolled students (if user has permission)
    let enrolledStudents = [];
    if (req.user.role === 'admin' || req.user.role === 'faculty') {
      enrolledStudents = await Enrollment.find({
        course: courseId,
        status: 'active'
      })
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName email')
      .sort({ 'student.rollNumber': 1 });
    }

    const courseDetails = {
      course: course,
      enrollmentStats: enrollmentStats,
      enrolledStudents: enrolledStudents,
      totalEnrolled: enrollmentStats.reduce((sum, stat) => sum + stat.count, 0)
    };

    logger.info(`Course details fetched by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course details retrieved successfully', courseDetails);

  } catch (error) {
    logger.error('Error fetching course details:', error);
    return errorResponse(res, 'Failed to fetch course details', 500);
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin, Faculty)
const createCourse = asyncHandler(async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to create course', 403);
    }

    const {
      name,
      code,
      description,
      department,
      credits,
      semester,
      academicYear,
      syllabus,
      coordinator,
      instructors,
      prerequisites,
      maxEnrollment,
      assessmentStructure
    } = req.body;

    // Check if course with same code exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return errorResponse(res, 'Course with this code already exists', 400);
    }

    // Validate coordinator and instructors are faculty members
    if (coordinator) {
      const coordinatorFaculty = await Faculty.findById(coordinator);
      if (!coordinatorFaculty) {
        return errorResponse(res, 'Invalid coordinator faculty ID', 400);
      }
    }

    if (instructors && instructors.length > 0) {
      const instructorFaculties = await Faculty.find({ _id: { $in: instructors } });
      if (instructorFaculties.length !== instructors.length) {
        return errorResponse(res, 'One or more instructor faculty IDs are invalid', 400);
      }
    }

    const course = new Course({
      name,
      code,
      description,
      department,
      credits,
      semester,
      academicYear,
      syllabus,
      faculty: {
        coordinator,
        instructors: instructors || []
      },
      prerequisites: prerequisites || [],
      maxEnrollment: maxEnrollment || 100,
      assessmentStructure: assessmentStructure || {
        internal: 40,
        external: 60
      },
      status: 'active',
      createdBy: req.user.id
    });

    await course.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_COURSE',
      resource: 'Course',
      resourceId: course._id,
      details: `Created new course: ${name} (${code})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const newCourse = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate('faculty.coordinator', 'firstName lastName')
      .populate('faculty.instructors', 'firstName lastName');

    logger.info(`Course created by user: ${req.user.id}, course: ${course._id}`);
    return successResponse(res, 'Course created successfully', newCourse);

  } catch (error) {
    logger.error('Error creating course:', error);
    return errorResponse(res, 'Failed to create course', 500);
  }
});

// @desc    Update course details
// @route   PUT /api/courses/:courseId
// @access  Private (Admin, Faculty Coordinator)
const updateCourse = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Check permission - Admin or course coordinator can update
    if (req.user.role !== 'admin') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || !course.faculty.coordinator.equals(faculty._id)) {
        return errorResponse(res, 'Insufficient permissions to update this course', 403);
      }
    }

    // Update course fields
    const allowedFields = [
      'name', 'description', 'syllabus', 'credits', 'maxEnrollment',
      'assessmentStructure', 'prerequisites', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        course[field] = updateData[field];
      }
    });

    // Handle faculty updates separately
    if (updateData.coordinator) {
      const coordinatorFaculty = await Faculty.findById(updateData.coordinator);
      if (!coordinatorFaculty) {
        return errorResponse(res, 'Invalid coordinator faculty ID', 400);
      }
      course.faculty.coordinator = updateData.coordinator;
    }

    if (updateData.instructors) {
      const instructorFaculties = await Faculty.find({ _id: { $in: updateData.instructors } });
      if (instructorFaculties.length !== updateData.instructors.length) {
        return errorResponse(res, 'One or more instructor faculty IDs are invalid', 400);
      }
      course.faculty.instructors = updateData.instructors;
    }

    course.lastModifiedBy = req.user.id;
    course.lastModifiedAt = new Date();
    await course.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_COURSE',
      resource: 'Course',
      resourceId: courseId,
      details: `Updated course: ${course.name} (${course.code})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const updatedCourse = await Course.findById(courseId)
      .populate('department', 'name code')
      .populate('faculty.coordinator', 'firstName lastName')
      .populate('faculty.instructors', 'firstName lastName')
      .populate('prerequisites', 'name code');

    logger.info(`Course updated by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course updated successfully', updatedCourse);

  } catch (error) {
    logger.error('Error updating course:', error);
    return errorResponse(res, 'Failed to update course', 500);
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:courseId
// @access  Private (Admin only)
const deleteCourse = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    // Only admin can delete courses
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only administrators can delete courses', 403);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Check if course has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'active'
    });

    if (activeEnrollments > 0) {
      return errorResponse(res, 'Cannot delete course with active enrollments', 400);
    }

    await Course.findByIdAndDelete(courseId);

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'DELETE_COURSE',
      resource: 'Course',
      resourceId: courseId,
      details: `Deleted course: ${course.name} (${course.code})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Course deleted by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course deleted successfully');

  } catch (error) {
    logger.error('Error deleting course:', error);
    return errorResponse(res, 'Failed to delete course', 500);
  }
});

// @desc    Get course enrollments
// @route   GET /api/courses/:courseId/enrollments
// @access  Private (Admin, Faculty)
const getEnrollments = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status = 'active' } = req.query;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to view enrollments', 403);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // If faculty, verify they have access to this course
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || 
          (!course.faculty.coordinator.equals(faculty._id) && 
           !course.faculty.instructors.includes(faculty._id))) {
        return errorResponse(res, 'Access denied for this course', 403);
      }
    }

    let query = { course: courseId };
    if (status !== 'all') query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'rollNumber studentId user currentSemester cgpa')
      .populate('student.user', 'firstName lastName email')
      .sort({ enrollmentDate: -1 });

    // Get enrollment statistics
    const stats = enrollments.reduce((acc, enrollment) => {
      acc.total++;
      acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
      return acc;
    }, { total: 0 });

    const enrollmentData = {
      course: {
        name: course.name,
        code: course.code,
        maxEnrollment: course.maxEnrollment
      },
      enrollments: enrollments,
      statistics: stats,
      availableSlots: course.maxEnrollment - (stats.active || 0)
    };

    logger.info(`Course enrollments fetched by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course enrollments retrieved successfully', enrollmentData);

  } catch (error) {
    logger.error('Error fetching course enrollments:', error);
    return errorResponse(res, 'Failed to fetch course enrollments', 500);
  }
});

// @desc    Enroll student in course
// @route   POST /api/courses/:courseId/enroll
// @access  Private (Admin, Student)
const enrollStudent = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Determine which student to enroll
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      // Students can only enroll themselves
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      targetStudentId = student._id;
    } else if (req.user.role !== 'admin') {
      return errorResponse(res, 'Insufficient permissions to enroll students', 403);
    }

    const student = await Student.findById(targetStudentId);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: targetStudentId,
      course: courseId
    });

    if (existingEnrollment) {
      return errorResponse(res, 'Student is already enrolled in this course', 400);
    }

    // Check course capacity
    const currentEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'active'
    });

    if (currentEnrollments >= course.maxEnrollment) {
      return errorResponse(res, 'Course is at maximum capacity', 400);
    }

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const completedCourses = await Enrollment.find({
        student: targetStudentId,
        course: { $in: course.prerequisites },
        status: 'completed',
        grade: { $in: ['A+', 'A', 'B+', 'B', 'C+', 'C'] } // Passing grades
      });

      if (completedCourses.length < course.prerequisites.length) {
        return errorResponse(res, 'Student has not completed required prerequisites', 400);
      }
    }

    const enrollment = new Enrollment({
      student: targetStudentId,
      course: courseId,
      academicYear: course.academicYear,
      semester: course.semester,
      credits: course.credits,
      enrollmentDate: new Date(),
      status: 'active',
      enrolledBy: req.user.id
    });

    await enrollment.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'ENROLL_STUDENT',
      resource: 'Enrollment',
      resourceId: enrollment._id,
      details: `Enrolled student ${student.rollNumber} in course ${course.code}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const newEnrollment = await Enrollment.findById(enrollment._id)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .populate('course', 'name code credits');

    logger.info(`Student enrolled by user: ${req.user.id}, enrollment: ${enrollment._id}`);
    return successResponse(res, 'Student enrolled successfully', newEnrollment);

  } catch (error) {
    logger.error('Error enrolling student:', error);
    return errorResponse(res, 'Failed to enroll student', 500);
  }
});

// @desc    Withdraw student from course
// @route   DELETE /api/courses/:courseId/withdraw
// @access  Private (Admin, Student)
const withdrawStudent = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    // Determine which student to withdraw
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      targetStudentId = student._id;
    } else if (req.user.role !== 'admin') {
      return errorResponse(res, 'Insufficient permissions to withdraw students', 403);
    }

    const enrollment = await Enrollment.findOne({
      student: targetStudentId,
      course: courseId,
      status: 'active'
    });

    if (!enrollment) {
      return errorResponse(res, 'Active enrollment not found', 404);
    }

    enrollment.status = 'withdrawn';
    enrollment.withdrawalDate = new Date();
    enrollment.withdrawnBy = req.user.id;
    await enrollment.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'WITHDRAW_STUDENT',
      resource: 'Enrollment',
      resourceId: enrollment._id,
      details: `Withdrew student from course`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Student withdrawn by user: ${req.user.id}, enrollment: ${enrollment._id}`);
    return successResponse(res, 'Student withdrawn successfully');

  } catch (error) {
    logger.error('Error withdrawing student:', error);
    return errorResponse(res, 'Failed to withdraw student', 500);
  }
});

// @desc    Get course syllabus
// @route   GET /api/courses/:courseId/syllabus
// @access  Private (All authenticated users)
const getSyllabus = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .select('name code syllabus assessmentStructure')
      .populate('department', 'name')
      .populate('faculty.coordinator', 'firstName lastName')
      .populate('prerequisites', 'name code');

    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    logger.info(`Course syllabus fetched by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course syllabus retrieved successfully', course);

  } catch (error) {
    logger.error('Error fetching course syllabus:', error);
    return errorResponse(res, 'Failed to fetch course syllabus', 500);
  }
});

// @desc    Update course syllabus
// @route   PUT /api/courses/:courseId/syllabus
// @access  Private (Admin, Faculty Coordinator)
const updateSyllabus = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;
    const { syllabus, assessmentStructure } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    // Check permission
    if (req.user.role !== 'admin') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (!faculty || !course.faculty.coordinator.equals(faculty._id)) {
        return errorResponse(res, 'Insufficient permissions to update syllabus', 403);
      }
    }

    if (syllabus) course.syllabus = syllabus;
    if (assessmentStructure) course.assessmentStructure = assessmentStructure;
    
    course.lastModifiedBy = req.user.id;
    course.lastModifiedAt = new Date();
    await course.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'UPDATE_SYLLABUS',
      resource: 'Course',
      resourceId: courseId,
      details: `Updated syllabus for course ${course.code}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Course syllabus updated by user: ${req.user.id}, course: ${courseId}`);
    return successResponse(res, 'Course syllabus updated successfully', course);

  } catch (error) {
    logger.error('Error updating course syllabus:', error);
    return errorResponse(res, 'Failed to update course syllabus', 500);
  }
});

module.exports = {
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
};