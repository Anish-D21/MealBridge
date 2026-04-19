const cron = require('node-cron');
const Donation = require('../models/Donation');

const startExpiryJob = () => {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

      const result = await Donation.updateMany(
        {
          status: { $in: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT'] },
          expiryTime: { $lt: oneHourFromNow },
        },
        { $set: { status: 'CANCELLED' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`⏱️ Expiry job: ${result.modifiedCount} donation(s) marked as CANCELLED (1-hour cutoff reached)`);
      }
    } catch (err) {
      console.error('❌ Expiry job error:', err.message);
    }
  });

  console.log('⏰ Expiry job scheduled (runs every minute for 1-hour cutoffs)');
};

module.exports = startExpiryJob;