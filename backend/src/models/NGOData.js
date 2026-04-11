const mongoose = require('mongoose');

const ngoDataSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  contact: { type: String },
  address: { type: String },
  ward: { type: String },
  isBmcPartner: { type: Boolean, default: false },
  areaOfWork: [{ type: String }],
}, { timestamps: false });

ngoDataSchema.index({ name: 'text' });
ngoDataSchema.index({ ward: 1 });

module.exports = mongoose.model('NGOData', ngoDataSchema);