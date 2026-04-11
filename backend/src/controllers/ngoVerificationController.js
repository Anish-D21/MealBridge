const { searchNGOByName, validateEmailForNGO } = require('../services/ngoMatchService');
const { generateOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');


// Temporary OTP store (for now)
global.otpStore = global.otpStore || {};


// 🔍 Step 1: Fuzzy search NGO name
exports.checkName = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please enter at least 3 characters.',
      });
    }

    const results = searchNGOByName(name.trim());

    if (results.length === 0) {
      return res.json({
        success: true,
        found: false,
        message: 'NGO not found in the Mumbai 2025 official directory.',
      });
    }

    const safeResults = results.map(({ id, name, ward, isBmcPartner, maskedEmail }) => ({
      id,
      name,
      ward,
      isBmcPartner,
      maskedEmail,
    }));

    res.json({ success: true, found: true, results: safeResults });
  } catch (err) {
    next(err);
  }
};


// 📧 Step 2: Validate email + send OTP
exports.verifyEmail = async (req, res, next) => {
  try {
    const { ngoId, email } = req.body;

    if (!ngoId || !email) {
      return res.status(400).json({
        success: false,
        message: 'NGO ID and email are required',
      });
    }

    const { valid, ngo } = await validateEmailForNGO(ngoId, email);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match official NGO record',
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    // Store temporarily
    global.otpStore[email] = {
      otp,
      ngoId,
      expires: otpExpires,
    };

    await sendOTPEmail(email, otp, ngo.name);

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });

  } catch (err) {
    next(err);
  }
};


// 🔐 Step 3: Confirm OTP
exports.confirmOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = global.otpStore[email];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please start again.',
      });
    }

    if (Date.now() > record.expires) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP',
      });
    }

    const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ✅ AFTER OTP SUCCESS

delete global.otpStore[email];

// 🔍 Check if user already exists
let user = await User.findOne({ email });

if (!user) {
  // 🆕 Create new NGO user
  user = await User.create({
    name: "NGO User",
    email,
    role: "NGO",
    ngoVerification: {
      status: "EMAIL_VERIFIED",
      trustScore: 90,
      matchedFromDataset: true,
      matchedNgoId: record.ngoId,
    },
  });
} else {
  // 🔄 Update existing user
  user.ngoVerification.status = "EMAIL_VERIFIED";
  user.ngoVerification.trustScore = 90;
  await user.save();
}

// 🔐 Generate JWT
const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// 🎉 Final response
res.json({
  success: true,
  message: "✅ NGO verified & logged in successfully!",
  token,
  user: {
    id: user._id,
    email: user.email,
    role: user.role,
    verificationStatus: user.ngoVerification.status,
  },
});

  } catch (err) {
    next(err);
  }
};


// 🆔 Step 4: Darpan submission (still requires login)
exports.submitDarpan = async (req, res, next) => {
  try {
    const { darpanId } = req.body;
    const userId = req.user._id;

    const darpanRegex = /^MH\/\d{4}\/\d{7}$/;

    if (!darpanRegex.test(darpanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Darpan ID format. Expected: MH/XXXX/XXXXXXX',
      });
    }

    const User = require('../models/User');

    await User.findByIdAndUpdate(userId, {
      'ngoVerification.status': 'PENDING_ADMIN',
      'ngoVerification.darpanId': darpanId,
      'ngoVerification.trustScore': 40,
    });

    res.json({
      success: true,
      message: 'Darpan ID submitted. Pending admin approval.',
    });

  } catch (err) {
    next(err);
  }
};