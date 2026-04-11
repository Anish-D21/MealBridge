const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GlobalStats = require('../models/GlobalStats');
const { sendWelcomeEmail } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, coordinates } = req.body;

    if (!['DONOR', 'NGO', 'VOLUNTEER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      location: coordinates
        ? { type: 'Point', coordinates }
        : { type: 'Point', coordinates: [0, 0] },
    });

    // Increment global stats
    const roleMap = { DONOR: 'totalDonors', NGO: 'totalNGOs', VOLUNTEER: 'totalVolunteers' };
    if (roleMap[role]) {
      await GlobalStats.findByIdAndUpdate(
        'global',
        { $inc: { [roleMap[role]]: 1 } },
        { upsert: true, new: true }
      );
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name, role).catch(() => {});

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};