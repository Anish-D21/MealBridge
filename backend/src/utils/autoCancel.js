const Donation = require('../models/Donation');

/**
 * Periodically sweeps through active donations and cancels any that are within
 * 1 hour of their strict expiration time. This ensures nobody picks up or attempts
 * to deliver food that is cutting it unacceptably close or has gone bad.
 */
const sweepExpiredDonations = async () => {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    const result = await Donation.updateMany(
      {
        status: { $in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] },
        expiryTime: { $lte: oneHourFromNow }
      },
      {
        $set: { status: 'CANCELLED' }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Auto-Cancel] Automatically swept and cancelled ${result.modifiedCount} expiring donations.`);
    }
  } catch (error) {
    console.error('[Auto-Cancel Error] Failed to sweep expired donations:', error.message);
  }
};

module.exports = sweepExpiredDonations;
