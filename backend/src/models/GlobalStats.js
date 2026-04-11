const mongoose = require('mongoose');

const globalStatsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  totalDonations: { type: Number, default: 0 },
  totalWeightKg: { type: Number, default: 0 },
  totalMealsProvided: { type: Number, default: 0 },
  totalCO2SavedKg: { type: Number, default: 0 },
  totalNGOs: { type: Number, default: 0 },
  totalVolunteers: { type: Number, default: 0 },
  totalDonors: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GlobalStats', globalStatsSchema);