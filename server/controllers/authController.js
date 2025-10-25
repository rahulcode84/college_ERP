const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, Student, Faculty, AuditLog } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendSuccess, sendError, sendCreated } = require('../utils/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../utils/emailHelper');
const logger = require('../utils/logger');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public (Admin only in production)
 */
const register = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    role,
    phone,
    dateOfBirth,
    gender,
    // Additional fields based on role
    studentData,
    facultyData
  } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return sendError(res, 'Passwords do not match', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 'User with this email already exists', 400);
  }

  try {
    // Create user
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      dateOfBirth,
      gender
    };

    const user = await User.create(userData);

    // Create role-specific profile
    let profile = null;
    if (role === 'student' && studentData) {
      profile = await Student.create({
        user: user._id,
        ...studentData
      });
    } else if (role === 'faculty' && facultyData) {
      profile = await Faculty.create({
        user: user._id,
        ...facultyData
      });
    }

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Log the registration
    await AuditLog.create({
      user: user._id,
      userRole: user.role,
      action: 'CREATE',
      resource: 'User',
      resourceId: user._id.toString(),
      description: `New ${role} account created`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl
    });

    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
      logger.error('Failed to send welcome email', { 
        userId: user._id, 
        email: user.email, 
        error: emailError.message 
      });
    }

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Remove password from response
    user.password = undefined;
    user.refreshToken = undefined;

    res
      .status(201)
      .cookie('token', token, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          profile,
          token,
          expiresIn: '24h'
        }
      });

  } catch (error) {
    logger.error('Registration error', { email, error: error.message });
    return sendError(res, 'Registration failed. Please try again.', 500);
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return sendError(res, 'Please provide email and password', 400);
  }

  try {
    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role');

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      // Log failed login attempt
      await AuditLog.create({
        user: user?._id || null,
        userRole: user?.role || 'unknown',
        action: 'LOGIN',
        resource: 'User',
        description: `Failed login attempt for email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: 'failure'
      });

      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 'Account is deactivated. Please contact administrator.', 401);
    }

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Update user login info
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Get user profile based on role
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id })
        .populate('department', 'name code');
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ user: user._id })
        .populate('department', 'name code');
    }

    // Log successful login
    await AuditLog.create({
      user: user._id,
      userRole: user.role,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user._id.toString(),
      description: 'Successful login',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      status: 'success'
    });

    // Set cookie options
    const cookieExpiration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
    const cookieOptions = {
      expires: new Date(Date.now() + cookieExpiration),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Remove sensitive data from response
    user.password = undefined;
    user.refreshToken = undefined;

    res
      .status(200)
      .cookie('token', token, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          profile,
          token,
          expiresIn: rememberMe ? '30d' : '24h'
        }
      });

  } catch (error) {
    logger.error('Login error', { email, error: error.message });
    return sendError(res, 'Login failed. Please try again.', 500);
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        refreshToken: undefined
      });

      // Log logout
      await AuditLog.create({
        user: req.user._id,
        userRole: req.user.role,
        action: 'LOGOUT',
        resource: 'User',
        resourceId: req.user._id.toString(),
        description: 'User logged out',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: 'success'
      });
    }

    // Clear cookies
    res
      .status(200)
      .clearCookie('token')
      .clearCookie('refreshToken')
      .json({
        success: true,
        message: 'Logout successful'
      });

  } catch (error) {
    logger.error('Logout error', { userId: req.user?._id, error: error.message });
    return sendError(res, 'Logout failed', 500);
  }
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get user profile based on role
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id })
        .populate('department', 'name code');
    } else if (user.role === 'faculty') {
      profile = await Faculty.findOne({ user: user._id })
        .populate('department', 'name code');
    }

    sendSuccess(res, 'User data retrieved successfully', {
      user,
      profile
    });

  } catch (error) {
    logger.error('Get me error', { userId: req.user._id, error: error.message });
    return sendError(res, 'Failed to get user data', 500);
  }
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken: clientRefreshToken } = req.body;
    let refreshTokenToVerify = clientRefreshToken;

    // Try to get refresh token from cookies if not in body
    if (!refreshTokenToVerify) {
      refreshTokenToVerify = req.cookies.refreshToken;
    }

    if (!refreshTokenToVerify) {
      return sendError(res, 'Refresh token not provided', 401);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenToVerify);
    
    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshTokenToVerify,
      isActive: true
    });

    if (!user) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // Set new cookies
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res
      .status(200)
      .cookie('token', newToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: '24h'
        }
      });

  } catch (error) {
    logger.error('Refresh token error', { error: error.message });
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return sendSuccess(res, 'If a user with this email exists, a password reset link has been sent');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash reset token and set expiry (10 minutes)
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      
      // Log password reset request
      await AuditLog.create({
        user: user._id,
        userRole: user.role,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'User',
        resourceId: user._id.toString(),
        description: 'Password reset requested',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestUrl: req.originalUrl
      });

      sendSuccess(res, 'Password reset link sent to your email');

    } catch (emailError) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      logger.error('Email sending failed', { 
        userId: user._id, 
        email: user.email, 
        error: emailError.message 
      });
      
      return sendError(res, 'Failed to send reset email. Please try again.', 500);
    }

  } catch (error) {
    logger.error('Forgot password error', { email, error: error.message });
    return sendError(res, 'Something went wrong. Please try again.', 500);
  }
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { resetToken } = req.params;

  // Check if passwords match
  if (password !== confirmPassword) {
    return sendError(res, 'Passwords do not match', 400);
  }

  try {
    // Hash the reset token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate all existing sessions

    await user.save();

    // Log password reset
    await AuditLog.create({
      user: user._id,
      userRole: user.role,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: user._id.toString(),
      description: 'Password reset completed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl
    });

    sendSuccess(res, 'Password reset successful. You can now login with your new password.');

  } catch (error) {
    logger.error('Reset password error', { resetToken, error: error.message });
    return sendError(res, 'Password reset failed. Please try again.', 500);
  }
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Check if new passwords match
  if (newPassword !== confirmPassword) {
    return sendError(res, 'New passwords do not match', 400);
  }

  try {
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    user.refreshToken = undefined; // Invalidate all existing sessions
    await user.save();

    // Log password change
    await AuditLog.create({
      user: user._id,
      userRole: user.role,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: user._id.toString(),
      description: 'Password changed by user',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl
    });

    sendSuccess(res, 'Password changed successfully. Please login again.');

  } catch (error) {
    logger.error('Change password error', { userId: req.user._id, error: error.message });
    return sendError(res, 'Password change failed. Please try again.', 500);
  }
});

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    // Hash the verification token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 'Invalid or expired verification token', 400);
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // Log email verification
    await AuditLog.create({
      user: user._id,
      userRole: user.role,
      action: 'EMAIL_VERIFICATION',
      resource: 'User',
      resourceId: user._id.toString(),
      description: 'Email verified successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl
    });

    sendSuccess(res, 'Email verified successfully');

  } catch (error) {
    logger.error('Email verification error', { token, error: error.message });
    return sendError(res, 'Email verification failed', 500);
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail
};