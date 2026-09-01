const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createTransaction, listTransactions, updateTransactionStatus } = require('../controllers/transactionController');
router.get('/', protect, listTransactions);
router.post('/', protect, createTransaction);
router.patch('/:id/status', protect, updateTransactionStatus);
module.exports = router;
