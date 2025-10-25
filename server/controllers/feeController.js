// server/controllers/feeController.js

const asyncHandler = require('../utils/asyncHandler');
const { Fee, Student, AuditLog } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// @desc    Get fee structure for a student
// @route   GET /api/fees/structure
// @access  Private (Student, Admin, Faculty)
const getFeeStructure = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.query;

    // Determine target student
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      targetStudentId = student._id;
    } else if (!studentId) {
      return errorResponse(res, 'Student ID is required', 400);
    }

    const student = await Student.findById(targetStudentId)
      .populate('user', 'firstName lastName')
      .populate('department', 'name');

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Get all fees for the student
    const fees = await Fee.find({ student: targetStudentId })
      .sort({ dueDate: -1 });

    // Calculate fee summary
    const summary = fees.reduce((acc, fee) => {
      acc.total += fee.amount;
      if (fee.status === 'paid') {
        acc.paid += fee.amount;
      } else if (fee.status === 'pending') {
        acc.pending += fee.amount;
        if (new Date(fee.dueDate) < new Date()) {
          acc.overdue += fee.amount;
        }
      }
      return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });

    // Group fees by type and academic year
    const feesByType = fees.reduce((acc, fee) => {
      if (!acc[fee.feeType]) {
        acc[fee.feeType] = [];
      }
      acc[fee.feeType].push(fee);
      return acc;
    }, {});

    const feeData = {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        department: student.department.name,
        currentSemester: student.currentSemester
      },
      summary: summary,
      fees: fees,
      feesByType: feesByType
    };

    logger.info(`Fee structure fetched for student: ${targetStudentId} by user: ${req.user.id}`);
    return successResponse(res, 'Fee structure retrieved successfully', feeData);

  } catch (error) {
    logger.error('Error fetching fee structure:', error);
    return errorResponse(res, 'Failed to fetch fee structure', 500);
  }
});

// @desc    Process fee payment
// @route   POST /api/fees/payment
// @access  Private (Student, Admin)
const processPayment = asyncHandler(async (req, res) => {
  try {
    const { 
      feeId, 
      amount, 
      paymentMethod, 
      transactionId, 
      paymentGateway,
      receiptNumber 
    } = req.body;

    const fee = await Fee.findById(feeId)
      .populate('student', 'rollNumber user')
      .populate('student.user', 'firstName lastName');

    if (!fee) {
      return errorResponse(res, 'Fee record not found', 404);
    }

    // Check permission - students can only pay their own fees
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || !fee.student._id.equals(student._id)) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    // Validate fee status
    if (fee.status === 'paid') {
      return errorResponse(res, 'Fee has already been paid', 400);
    }

    // Validate payment amount
    if (amount < fee.amount) {
      return errorResponse(res, 'Payment amount is less than fee amount', 400);
    }

    // Calculate excess amount
    const excessAmount = amount - fee.amount;

    // Update fee record
    fee.status = 'paid';
    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.paymentGateway = paymentGateway;
    fee.receiptNumber = receiptNumber || `RCP-${Date.now()}`;
    fee.amountPaid = amount;
    fee.excessAmount = excessAmount;
    fee.processedBy = req.user.id;
    fee.processedAt = new Date();

    await fee.save();

    // Create excess amount record if applicable
    if (excessAmount > 0) {
      const excessFee = new Fee({
        student: fee.student._id,
        feeType: 'excess_credit',
        description: `Excess amount from payment of ${fee.description}`,
        amount: -excessAmount, // Negative amount indicates credit
        dueDate: new Date(),
        status: 'paid',
        academicYear: fee.academicYear,
        semester: fee.semester,
        paymentDate: new Date(),
        createdBy: req.user.id
      });
      await excessFee.save();
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'PROCESS_PAYMENT',
      resource: 'Fee',
      resourceId: feeId,
      details: `Processed payment of ${amount} for ${fee.description} - Student: ${fee.student.rollNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    const paymentData = {
      fee: fee,
      paymentDetails: {
        amount: amount,
        method: paymentMethod,
        transactionId: transactionId,
        receiptNumber: fee.receiptNumber,
        paymentDate: fee.paymentDate,
        excessAmount: excessAmount
      }
    };

    logger.info(`Payment processed by user: ${req.user.id}, fee: ${feeId}, amount: ${amount}`);
    return successResponse(res, 'Payment processed successfully', paymentData);

  } catch (error) {
    logger.error('Error processing payment:', error);
    return errorResponse(res, 'Failed to process payment', 500);
  }
});

// @desc    Get payment history
// @route   GET /api/fees/payment-history
// @access  Private (Student, Admin, Faculty)
const getPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const { 
      studentId, 
      fromDate, 
      toDate, 
      paymentMethod,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    let query = { status: 'paid' };

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) {
        return errorResponse(res, 'Student profile not found', 404);
      }
      query.student = student._id;
    } else if (studentId) {
      query.student = studentId;
    }

    // Apply additional filters
    if (fromDate && toDate) {
      query.paymentDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Fee.find(query)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Fee.countDocuments(query);

    // Calculate summary
    const summary = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountPaid' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amountPaid' }
        }
      }
    ]);

    // Group by payment method
    const byPaymentMethod = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$amountPaid' }
        }
      }
    ]);

    const paymentData = {
      payments: payments,
      summary: summary[0] || { totalAmount: 0, totalPayments: 0, avgPayment: 0 },
      byPaymentMethod: byPaymentMethod,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    logger.info(`Payment history fetched by user: ${req.user.id}`);
    return successResponse(res, 'Payment history retrieved successfully', paymentData);

  } catch (error) {
    logger.error('Error fetching payment history:', error);
    return errorResponse(res, 'Failed to fetch payment history', 500);
  }
});

// @desc    Generate fee receipt
// @route   GET /api/fees/receipt/:feeId
// @access  Private (Student, Admin, Faculty)
const generateReceipt = asyncHandler(async (req, res) => {
  try {
    const { feeId } = req.params;

    const fee = await Fee.findById(feeId)
      .populate('student', 'rollNumber studentId user')
      .populate('student.user', 'firstName lastName')
      .populate('student.department', 'name');

    if (!fee) {
      return errorResponse(res, 'Fee record not found', 404);
    }

    if (fee.status !== 'paid') {
      return errorResponse(res, 'Receipt can only be generated for paid fees', 400);
    }

    // Check permission
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || !fee.student._id.equals(student._id)) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    const receiptData = {
      receiptNumber: fee.receiptNumber,
      student: {
        name: `${fee.student.user.firstName} ${fee.student.user.lastName}`,
        rollNumber: fee.student.rollNumber,
        studentId: fee.student.studentId,
        department: fee.student.department.name
      },
      fee: {
        type: fee.feeType,
        description: fee.description,
        amount: fee.amount,
        amountPaid: fee.amountPaid,
        excessAmount: fee.excessAmount || 0,
        academicYear: fee.academicYear,
        semester: fee.semester
      },
      payment: {
        date: fee.paymentDate,
        method: fee.paymentMethod,
        transactionId: fee.transactionId,
        paymentGateway: fee.paymentGateway
      },
      generatedAt: new Date(),
      generatedBy: req.user.id
    };

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'GENERATE_RECEIPT',
      resource: 'Fee',
      resourceId: feeId,
      details: `Generated receipt for fee payment - Receipt: ${fee.receiptNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Receipt generated by user: ${req.user.id}, fee: ${feeId}`);
    return successResponse(res, 'Receipt generated successfully', receiptData);

  } catch (error) {
    logger.error('Error generating receipt:', error);
    return errorResponse(res, 'Failed to generate receipt', 500);
  }
});

// @desc    Manage fee concessions and scholarships
// @route   POST /api/fees/concession
// @access  Private (Admin only)
const manageConcessions = asyncHandler(async (req, res) => {
  try {
    const { 
      studentId, 
      feeType, 
      concessionType, 
      amount, 
      percentage, 
      description, 
      validFrom, 
      validTo 
    } = req.body;

    // Only admin can manage concessions
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only administrators can manage fee concessions', 403);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Calculate concession amount
    let concessionAmount = amount || 0;
    if (percentage && !amount) {
      // Find base fee amount
      const baseFee = await Fee.findOne({
        student: studentId,
        feeType: feeType,
        status: 'pending'
      });
      
      if (baseFee) {
        concessionAmount = (baseFee.amount * percentage) / 100;
      }
    }

    // Create concession record
    const concession = new Fee({
      student: studentId,
      feeType: `${feeType}_concession`,
      description: description || `${concessionType} concession for ${feeType}`,
      amount: -Math.abs(concessionAmount), // Negative amount for concession
      dueDate: new Date(),
      status: 'paid', // Concessions are automatically applied
      academicYear: new Date().getFullYear(),
      semester: student.currentSemester,
      paymentDate: new Date(),
      concessionType: concessionType,
      concessionDetails: {
        percentage: percentage,
        originalAmount: amount,
        validFrom: validFrom,
        validTo: validTo
      },
      createdBy: req.user.id,
      processedBy: req.user.id,
      processedAt: new Date()
    });

    await concession.save();

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_CONCESSION',
      resource: 'Fee',
      resourceId: concession._id,
      details: `Created ${concessionType} concession of ${concessionAmount} for student ${student.rollNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Fee concession created by admin: ${req.user.id}, student: ${studentId}, amount: ${concessionAmount}`);
    return successResponse(res, 'Fee concession created successfully', concession);

  } catch (error) {
    logger.error('Error managing fee concession:', error);
    return errorResponse(res, 'Failed to manage fee concession', 500);
  }
});

// @desc    Get fee reports for administration
// @route   GET /api/fees/reports
// @access  Private (Admin, Faculty)
const getFeeReports = asyncHandler(async (req, res) => {
  try {
    const { 
      reportType, 
      fromDate, 
      toDate, 
      department, 
      semester, 
      academicYear 
    } = req.query;

    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
      return errorResponse(res, 'Insufficient permissions to view fee reports', 403);
    }

    let reportData = {};

    switch (reportType) {
      case 'collection':
        reportData = await generateCollectionReport(fromDate, toDate, department);
        break;
      case 'pending':
        reportData = await generatePendingFeesReport(department, semester, academicYear);
        break;
      case 'overdue':
        reportData = await generateOverdueFeesReport(department);
        break;
      case 'concessions':
        reportData = await generateConcessionsReport(fromDate, toDate, department);
        break;
      case 'summary':
        reportData = await generateSummaryReport(academicYear, semester);
        break;
      default:
        return errorResponse(res, 'Invalid report type', 400);
    }

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'GENERATE_FEE_REPORT',
      resource: 'Fee',
      details: `Generated ${reportType} fee report`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Fee report generated by user: ${req.user.id}, type: ${reportType}`);
    return successResponse(res, 'Fee report generated successfully', {
      reportType: reportType,
      generatedAt: new Date(),
      data: reportData
    });

  } catch (error) {
    logger.error('Error generating fee report:', error);
    return errorResponse(res, 'Failed to generate fee report', 500);
  }
});

// @desc    Create bulk fee records
// @route   POST /api/fees/bulk-create
// @access  Private (Admin only)
const createBulkFees = asyncHandler(async (req, res) => {
  try {
    const { 
      feeType, 
      amount, 
      description, 
      dueDate, 
      academicYear, 
      semester,
      studentFilters 
    } = req.body;

    // Only admin can create bulk fees
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Only administrators can create bulk fees', 403);
    }

    // Build student query based on filters
    let studentQuery = {};
    if (studentFilters.department) studentQuery.department = studentFilters.department;
    if (studentFilters.semester) studentQuery.currentSemester = studentFilters.semester;
    if (studentFilters.batch) studentQuery.batch = studentFilters.batch;

    const students = await Student.find(studentQuery);

    if (students.length === 0) {
      return errorResponse(res, 'No students found matching the criteria', 404);
    }

    // Create fee records for all matching students
    const feeRecords = [];
    for (const student of students) {
      const fee = new Fee({
        student: student._id,
        feeType: feeType,
        description: description,
        amount: amount,
        dueDate: new Date(dueDate),
        status: 'pending',
        academicYear: academicYear,
        semester: semester,
        createdBy: req.user.id
      });
      
      feeRecords.push(fee);
    }

    // Bulk insert
    const createdFees = await Fee.insertMany(feeRecords);

    // Log the action
    const auditLog = new AuditLog({
      user: req.user.id,
      action: 'CREATE_BULK_FEES',
      resource: 'Fee',
      details: `Created ${createdFees.length} fee records of type ${feeType}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await auditLog.save();

    logger.info(`Bulk fees created by admin: ${req.user.id}, count: ${createdFees.length}`);
    return successResponse(res, 'Bulk fees created successfully', {
      count: createdFees.length,
      feeType: feeType,
      amount: amount,
      studentsAffected: students.length
    });

  } catch (error) {
    logger.error('Error creating bulk fees:', error);
    return errorResponse(res, 'Failed to create bulk fees', 500);
  }
});

// Helper functions for report generation
const generateCollectionReport = async (fromDate, toDate, department) => {
  const matchQuery = {
    status: 'paid',
    paymentDate: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  };

  return await Fee.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    department ? {
      $match: { 'studentInfo.department': department }
    } : { $match: {} },
    {
      $group: {
        _id: '$feeType',
        totalAmount: { $sum: '$amountPaid' },
        count: { $sum: 1 }
      }
    }
  ]);
};

const generatePendingFeesReport = async (department, semester, academicYear) => {
  const matchQuery = { status: 'pending' };
  if (semester) matchQuery.semester = semester;
  if (academicYear) matchQuery.academicYear = academicYear;

  return await Fee.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    department ? {
      $match: { 'studentInfo.department': department }
    } : { $match: {} },
    {
      $group: {
        _id: '$feeType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

const generateOverdueFeesReport = async (department) => {
  const currentDate = new Date();
  
  return await Fee.aggregate([
    { 
      $match: { 
        status: 'pending',
        dueDate: { $lt: currentDate }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    department ? {
      $match: { 'studentInfo.department': department }
    } : { $match: {} },
    {
      $group: {
        _id: '$feeType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

const generateConcessionsReport = async (fromDate, toDate, department) => {
  const matchQuery = {
    amount: { $lt: 0 }, // Negative amounts are concessions
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  };

  return await Fee.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    department ? {
      $match: { 'studentInfo.department': department }
    } : { $match: {} },
    {
      $group: {
        _id: '$concessionType',
        totalAmount: { $sum: { $abs: '$amount' } },
        count: { $sum: 1 }
      }
    }
  ]);
};

const generateSummaryReport = async (academicYear, semester) => {
  const matchQuery = {};
  if (academicYear) matchQuery.academicYear = academicYear;
  if (semester) matchQuery.semester = semester;

  return await Fee.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = {
  getFeeStructure,
  processPayment,
  getPaymentHistory,
  generateReceipt,
  manageConcessions,
  getFeeReports,
  createBulkFees
};