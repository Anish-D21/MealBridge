const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, 
    required: function () {
    return this.role !== "NGO"; // NGOs don't need password
  }, 
  minlength: 6 },
  role: {
    type: String,
    enum: ['DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'],
    required: true,
  },
  phone: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  ngoVerification: {
    status: {
      type: String,
      enum: ['UNVERIFIED', 'DATASET_MATCHED', 'EMAIL_VERIFIED', 'PENDING_ADMIN', 'VERIFIED'],
      default: 'UNVERIFIED',
    },
    darpanId: { type: String },
    matchedFromDataset: { type: Boolean, default: false },
    matchedNgoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGOData' },
    trustScore: { type: Number, default: 0 },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.ngoVerification?.otp;
  return obj;
};

module.exports = mongoose.model('User', userSchema);