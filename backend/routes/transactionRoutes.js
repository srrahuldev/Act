const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboard
} = require('../controllers/transactionController');

/**
 * @swagger
 * /api/transactions/dashboard:
 *   get:
 *     summary: Get user dashboard summary
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
router.get('/dashboard', auth, getDashboard);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all user transactions (not deleted)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               debit:
 *                 type: number
 *               credit:
 *                 type: number
 *               amountUsed:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.route('/').get(auth, getTransactions).post(auth, createTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Transaction updated
 *   delete:
 *     summary: Soft delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction soft deleted
 */
router.route('/:id').put(auth, updateTransaction).delete(auth, deleteTransaction);

module.exports = router;
