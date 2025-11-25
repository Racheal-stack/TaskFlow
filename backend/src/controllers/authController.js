const User = require('../models/User');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        workspaces: user.workspaces,
        currentWorkspace: user.currentWorkspace,
        preferences: user.preferences
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, workspaceName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false
    });

    // Create default workspace if provided
    if (workspaceName) {
      // Generate unique slug
      let baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
      let slug = baseSlug;
      let counter = 1;
      
      // Check for existing slugs and increment counter if needed
      while (await Workspace.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const workspace = await Workspace.create({
        name: workspaceName,
        owner: user._id,
        slug
      });

      // Add user to workspace
      user.workspaces.push({
        workspace: workspace._id,
        role: 'owner'
      });
      user.currentWorkspace = workspace._id;
      await user.save();
    }

    // Send verification email
    try {
      const emailService = require('../services/emailService');
      await emailService.sendVerificationEmail(user.email, verificationCode);
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find user with matching email and verification code
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationCode: verificationCode,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Mark email as verified and clear verification fields
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email if user has workspace
    if (user.currentWorkspace) {
      try {
        const workspace = await Workspace.findById(user.currentWorkspace);
        if (workspace) {
          const emailService = require('../services/emailService');
          await emailService.sendWelcomeEmail(user, workspace);
        }
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: false 
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send verification email
    try {
      const emailService = require('../services/emailService');
      await emailService.sendVerificationEmail(user.email, verificationCode);
    } catch (emailError) {
      console.error('Resend verification email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    })
    .select('+password')
    .populate('workspaces.workspace', 'name slug subscription');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your email for the verification code.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('workspaces.workspace', 'name slug subscription limits usage')
      .populate('currentWorkspace', 'name slug subscription limits usage');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        workspaces: user.workspaces,
        currentWorkspace: user.currentWorkspace,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, avatar, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('ChangePassword error:', error);
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // TODO: Send email with reset link
    console.log('Password reset URL:', resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('ResetPassword error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Switch workspace
// @route   POST /api/auth/switch-workspace
// @access  Private
const switchWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.body;

    const user = await User.findById(req.user.id);

    // Check if user has access to workspace
    if (!user.hasWorkspaceAccess(workspaceId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace'
      });
    }

    user.currentWorkspace = workspaceId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Workspace switched successfully',
      currentWorkspace: workspaceId
    });
  } catch (error) {
    console.error('SwitchWorkspace error:', error);
    next(error);
  }
};

// @desc    Test email service
// @route   POST /api/auth/test-email
// @access  Private (Admin only)
const testEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Check if user is admin (you can modify this check based on your needs)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const testEmail = email || req.user.email;
    
    const emailService = require('../services/emailService');
    
    // Get email service status
    const status = emailService.getStatus();
    
    if (!status.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Email service not initialized',
        status
      });
    }

    // Send test email
    const result = await emailService.sendTestEmail(testEmail);
    
    res.status(200).json({
      success: result.success,
      message: result.success 
        ? `Test email sent successfully to ${testEmail}` 
        : `Failed to send test email: ${result.message}`,
      status,
      result
    });
  } catch (error) {
    console.error('Test email error:', error);
    next(error);
  }
};

// @desc    Get email service status
// @route   GET /api/auth/email-status  
// @access  Private (Admin only)
const getEmailStatus = async (req, res, next) => {
  try {
    const emailService = require('../services/emailService');
    const status = emailService.getStatus();
    
    res.status(200).json({
      success: true,
      status,
      providers: {
        gmail: emailService.getProviderConfig('gmail'),
        outlook: emailService.getProviderConfig('outlook'),
        yahoo: emailService.getProviderConfig('yahoo'),
        sendgrid: emailService.getProviderConfig('sendgrid'),
        mailgun: emailService.getProviderConfig('mailgun')
      }
    });
  } catch (error) {
    console.error('Email status error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  switchWorkspace,
  testEmail,
  getEmailStatus
};