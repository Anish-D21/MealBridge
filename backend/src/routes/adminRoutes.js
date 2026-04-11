const express = require('express');
const router = express.Router();
const {
  getPendingNGOs,
  approveNGO,
  rejectNGO,
  getAdminStats,
  getAllUsers,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect, requireRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/pending-ngos', getPendingNGOs);
router.get('/users', getAllUsers);
router.patch('/approve/:id', approveNGO);
router.patch('/reject/:id', rejectNGO);

module.exports = router;