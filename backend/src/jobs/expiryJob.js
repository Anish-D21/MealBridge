const cron = require('node-cron');
const Donation = require('../models/Donation');

const startExpiryJob = () => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Donation.updateMany(
        {
          status: 'AVAILABLE',
          expiryTime: { $lt: new Date() },
        },
        { $set: { status: 'EXPIRED' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`⏱️ Expiry job: ${result.modifiedCount} donation(s) marked as EXPIRED`);
      }
    } catch (err) {
      console.error('❌ Expiry job error:', err.message);
    }
  });

  console.log('⏰ Expiry job scheduled (runs every hour)');
};

module.exports = startExpiryJob;