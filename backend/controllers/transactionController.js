const Transaction = require('../models/Transaction');

// @desc    Get logged in user transactions (not deleted)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Auto Update Advance Payment to Success on or after Due Date
    await Transaction.updateMany({
      userId: req.user.id,
      type: 'Advance Payment',
      status: { $in: ['Pending', ''] },
      dueDate: { $lte: today }
    }, {
      $set: { status: 'Success' }
    });

    const filter = { userId: req.user.id, isDeleted: false };
    
    // Date filters
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    } else if (req.query.month && req.query.year) {
      const month = parseInt(req.query.month) - 1;
      const year = parseInt(req.query.year);
      filter.date = { 
        $gte: new Date(year, month, 1), 
        $lt: new Date(year, month + 1, 1) 
      };
    } else if (req.query.year) {
      const year = parseInt(req.query.year);
      filter.date = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) };
    }

    // Search filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    
    // Normalize data for frontend
    const mapped = transactions.map(t => {
      const obj = t.toObject();
      return {
        ...obj,
        name: obj.name || obj.firstName || 'Unknown',
        amount: obj.amount || (obj.debit > 0 ? obj.debit : (obj.credit > 0 ? obj.credit : 0)),
        type: obj.type || (obj.debit > 0 ? 'Debit' : 'Credit')
      };
    });
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const transaction = new Transaction({
      userId: req.user.id,
      name: req.body.name,
      lastName: req.body.lastName || '',
      amount: req.body.amount || 0,
      type: req.body.type || 'Credit',
      description: req.body.description || '',
      category: req.body.category || 'General',
      paymentMethod: req.body.paymentMethod || 'Cash',
      paymentApp: req.body.paymentApp || '',
      status: req.body.status || 'Pending',
      emiPaidDate: req.body.emiPaidDate,
      loanDate: req.body.loanDate,
      dueDate: req.body.dueDate,
      date: req.body.date || Date.now()
    });
    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Soft delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const result = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isDeleted: true },
      { new: true }
    );
    if (!result) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction archived successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/transactions/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    
    // Auto Update Advance Payment to Success on or after Due Date
    await Transaction.updateMany({
      userId: req.user.id,
      type: 'Advance Payment',
      status: { $in: ['Pending', ''] },
      dueDate: { $lte: today }
    }, {
      $set: { status: 'Success' }
    });

    const transactions = await Transaction.find({ userId: req.user.id, isDeleted: false }).sort({ date: -1 });
    
    let totalDebit = 0;
    let totalCredit = 0;

    transactions.forEach(t => {
      const amt = t.amount || (t.debit > 0 ? t.debit : (t.credit > 0 ? t.credit : 0));
      if (t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan') {
        totalDebit += amt;
      } else if (t.type === 'Credit') {
        totalCredit += amt;
      }
    });


    res.json({
      totalTransactions: transactions.length,
      totalDebit,
      totalCredit,
      totalBalance: totalCredit - totalDebit,
      recentTransactions: transactions.slice(0, 8) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboard
};
