const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import controllers
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail
} = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

// Import validation schemas
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword
} = require('../validation/authValidation');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  }
});

// Public routes
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password/:resetToken', validateResetPassword, handleValidationErrors, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, validateChangePassword, handleValidationErrors, changePassword);

module.exports = router;
