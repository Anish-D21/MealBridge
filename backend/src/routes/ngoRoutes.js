const express = require('express');
const router = express.Router();

const {
  checkName,
  verifyEmail,
  confirmOTP,
  submitDarpan,
} = require('../controllers/ngoVerificationController');

const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');


// 🔓 PUBLIC ROUTES (NO LOGIN REQUIRED)
router.post('/check-name', checkName);
router.post('/verify-email', verifyEmail);
router.post('/confirm-otp', confirmOTP);


// 🔒 PROTECTED ROUTES (LOGIN REQUIRED)
router.post('/submit-darpan', protect, requireRole('NGO'), submitDarpan);

module.exports = router;