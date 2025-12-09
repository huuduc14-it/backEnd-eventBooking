const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create payment URL (protected - user must be authenticated)
router.post('/payment/create', authMiddleware, paymentController.createPayment);

// VNPay return URL (public - callback from VNPay)
router.get('/payment/vnpay-return', paymentController.vnpayReturn);

// VNPay IPN (public - server-to-server notification)
router.get('/payment/vnpay-ipn', paymentController.vnpayIPN);

// Query transaction status (protected)
router.get('/payment/query/:bookingId', authMiddleware, paymentController.queryTransaction);

// Refund transaction (protected)
router.post('/payment/refund', authMiddleware, paymentController.refundTransaction);

module.exports = router;
