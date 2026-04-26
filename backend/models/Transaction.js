const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  firstName: { type: String }, // Legacy
  lastName: { type: String, default: '' },
  amount: { type: Number },
  debit: { type: Number }, // Legacy
  credit: { type: Number }, // Legacy
  type: { type: String, enum: ['Credit', 'Debit', 'EMI', 'Loan', 'Advance Payment'] },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  paymentApp: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Success', 'Paid'], default: 'Pending' },
  emiPaidDate: { type: Date },
  loanDate: { type: Date },
  dueDate: { type: Date },
  interestRate: { type: Number }, // Loan interest %
  loanDuration: { type: Number }, // Duration in months
  isDeleted: { type: Boolean, default: false }


}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
