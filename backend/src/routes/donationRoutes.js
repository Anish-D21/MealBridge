const express = require('express');
const router = express.Router();
const {
  createDonation,
  getNearbyDonations,
  getMyDonations,
  reserveDonation,
  getReservedDonations,
  acceptDelivery,
  completeDonation,
  getGlobalStats,
  getMyTasks,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole, requireVerifiedNGO } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public
router.get('/stats', getGlobalStats);

// Protected
router.use(protect);

// Donor
router.post('/', requireRole('DONOR'), upload.single('image'), createDonation);
router.get('/my', requireRole('DONOR'), getMyDonations);
router.delete('/:id', requireRole('DONOR'), exports.deleteDonation ? exports.deleteDonation : require('../controllers/donationController').deleteDonation);

// NGO
router.get('/nearby', requireVerifiedNGO, getNearbyDonations);
router.patch('/:id/reserve', requireVerifiedNGO, reserveDonation);
router.get('/ngo/claims', requireVerifiedNGO, exports.getNgoClaims ? exports.getNgoClaims : require('../controllers/donationController').getNgoClaims);

// Volunteer
router.get('/reserved', requireRole('VOLUNTEER'), getReservedDonations);
router.patch('/:id/accept-delivery', requireRole('VOLUNTEER'), acceptDelivery);
router.patch('/:id/complete', requireRole('VOLUNTEER'), completeDonation);
router.get('/volunteer/my-tasks', requireRole('VOLUNTEER'), getMyTasks);

module.exports = router;