const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// Get all customers (for specific user)
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new customer
router.post('/', auth, async (req, res) => {
  const customer = new Customer({
    userId: req.user.id,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    balance: req.body.balance || 0,
    pending: req.body.pending || 0,
    imgBg: req.body.imgBg || 'primary'
  });

  try {
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
