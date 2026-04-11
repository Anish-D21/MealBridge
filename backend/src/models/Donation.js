const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodItems: { type: String, required: true, trim: true },
  description: { type: String },
  weight: { type: Number, required: true, min: 0.1 }, // in kg
  expiryTime: { type: Date, required: true },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  ward: { type: String },
  address: { type: String },
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'COMPLETED', 'EXPIRED'],
    default: 'AVAILABLE',
  },
  assignedNgo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reservedAt: { type: Date },
  completedAt: { type: Date },
  // Computed impact
  mealsProvided: { type: Number },
  co2Saved: { type: Number },
  safetyDisclaimer: { type: Boolean, default: false },
}, { timestamps: true });

donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1 });
donationSchema.index({ expiryTime: 1 });
donationSchema.index({ donorId: 1 });

module.exports = mongoose.model('Donation', donationSchema);