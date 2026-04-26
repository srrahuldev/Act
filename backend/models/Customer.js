const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  balance: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  transactionsCount: { type: Number, default: 0 },
  imgBg: { type: String, default: 'primary' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
