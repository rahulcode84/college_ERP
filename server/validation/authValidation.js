const { body, param } = require('express-validator');

// Register validation
const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),

  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('role')
    .isIn(['student', 'faculty', 'admin', 'librarian'])
    .withMessage('Invalid role. Must be student, faculty, admin, or librarian'),

  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 16 || age > 100) {
        throw new Error('Age must be between 16 and 100 years');
      }
      return true;
    }),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),

  // Student-specific validation
  body('studentData.studentId')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Student ID is required for students')
    .isLength({ min: 5, max: 20 })
    .withMessage('Student ID must be between 5 and 20 characters')
    .isAlphanumeric()
    .withMessage('Student ID can only contain letters and numbers'),

  body('studentData.rollNumber')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Roll number is required for students')
    .isLength({ min: 5, max: 20 })
    .withMessage('Roll number must be between 5 and 20 characters'),

  body('studentData.department')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Department is required for students')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('studentData.semester')
    .if(body('role').equals('student'))
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),

  body('studentData.batch')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Batch is required for students')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Batch must be in format YYYY-YYYY (e.g., 2021-2025)'),

  // Faculty-specific validation
  body('facultyData.employeeId')
    .if(body('role').equals('faculty'))
    .notEmpty()
    .withMessage('Employee ID is required for faculty')
    .isLength({ min: 5, max: 20 })
    .withMessage('Employee ID must be between 5 and 20 characters')
    .isAlphanumeric()
    .withMessage('Employee ID can only contain letters and numbers'),

  body('facultyData.department')
    .if(body('role').equals('faculty'))
    .notEmpty()
    .withMessage('Department is required for faculty')
    .isMongoId()
    .withMessage('Invalid department ID'),

  body('facultyData.designation')
    .if(body('role').equals('faculty'))
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant', 'HOD'])
    .withMessage('Invalid designation'),

  body('facultyData.joiningDate')
    .if(body('role').equals('faculty'))
    .isISO8601()
    .withMessage('Please provide a valid joining date')
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Reset password validation
const validateResetPassword = [
  param('resetToken')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),

  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword
};