const User = require('../models/User');
const Donation = require('../models/Donation');
const GlobalStats = require('../models/GlobalStats');

// GET /api/admin/pending-ngos
exports.getPendingNGOs = async (req, res, next) => {
  try {
    const ngos = await User.find({
      role: 'NGO',
      'ngoVerification.status': 'PENDING_ADMIN',
    }).select('name email ngoVerification createdAt');

    res.json({ success: true, count: ngos.length, ngos });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/approve/:id
exports.approveNGO = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        'ngoVerification.status': 'VERIFIED',
        'ngoVerification.trustScore': 75,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'NGO approved successfully.', user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/reject/:id
exports.rejectNGO = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        'ngoVerification.status': 'UNVERIFIED',
        'ngoVerification.darpanId': null,
        'ngoVerification.trustScore': 0,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'NGO rejected.', user });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats — Admin overview
exports.getAdminStats = async (req, res, next) => {
  try {
    const [stats, pendingCount, totalUsers, recentDonations] = await Promise.all([
      GlobalStats.findById('global'),
      User.countDocuments({ role: 'NGO', 'ngoVerification.status': 'PENDING_ADMIN' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Donation.find().sort({ createdAt: -1 }).limit(10).populate('donorId', 'name'),
    ]);

    res.json({
      success: true,
      stats: stats || {},
      pendingNGOs: pendingCount,
      userBreakdown: totalUsers,
      recentDonations,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/all-users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};