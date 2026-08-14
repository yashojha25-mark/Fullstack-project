const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return errorResponse(res, 'Email already registered. Please log in.', 409);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id, user.role);

  res.cookie('token', token, COOKIE_OPTIONS);
  return successResponse(
    res,
    'Account created successfully',
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    201
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user._id, user.role);
  res.cookie('token', token, COOKIE_OPTIONS);

  return successResponse(res, 'Logged in successfully', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
  });
  return successResponse(res, 'Logged out successfully');
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return successResponse(res, 'User fetched successfully', req.user);
};

module.exports = { register, login, logout, getMe };
