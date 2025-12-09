const vnpay = require('../utils/vnpay');
const bookingModel = require('../models/bookingModel');
const db = require('../config/db');

// Create payment URL
exports.createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    // Get booking details
    const booking = await bookingModel.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    // Get client IP
    let ipAddr = req.headers['x-forwarded-for'] ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress ||
                 req.connection.socket.remoteAddress;

    if (ipAddr && ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0];
    }

    // Create payment URL
    const orderInfo = `Thanh toan booking ${bookingId}`;
    const paymentUrl = vnpay.createPaymentUrl(
      req,
      bookingId,
      booking.total_amount,
      orderInfo,
      ipAddr
    );

    res.json({
      message: 'Payment URL created successfully',
      paymentUrl
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// VNPay return callback
exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;

    // Verify signature
    const isValid = vnpay.verifyReturnUrl(vnp_Params);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const bookingId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (responseCode === '00') {
      // Payment success
      await bookingModel.updatePaymentStatus(bookingId, 'paid');

      // Return success page or redirect
      res.json({
        success: true,
        message: 'Payment successful',
        bookingId
      });
    } else {
      // Payment failed
      await bookingModel.updatePaymentStatus(bookingId, 'failed');

      res.json({
        success: false,
        message: 'Payment failed',
        responseCode
      });
    }
  } catch (error) {
    console.error('Error processing VNPay return:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// VNPay IPN (Instant Payment Notification)
exports.vnpayIPN = async (req, res) => {
  try {
    let vnp_Params = req.query;
    
    // Verify signature
    const isValid = vnpay.verifyReturnUrl(vnp_Params);

    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const bookingId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    
    // Get booking
    const booking = await bookingModel.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Check if already updated
    if (booking.payment_status === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // Check amount
    const amount = vnp_Params['vnp_Amount'] / 100;
    if (amount !== booking.total_amount) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    // Update payment status
    if (responseCode === '00') {
      await bookingModel.updatePaymentStatus(bookingId, 'paid');
      res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      await bookingModel.updatePaymentStatus(bookingId, 'failed');
      res.status(200).json({ RspCode: '00', Message: 'Success' });
    }
  } catch (error) {
    console.error('Error processing VNPay IPN:', error);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// Query transaction status
exports.queryTransaction = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    // Get booking
    const booking = await bookingModel.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get transaction date from booking
    const transactionDate = new Date(booking.created_at)
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);

    // Query VNPay
    const result = await vnpay.queryTransaction(bookingId, transactionDate);

    res.json(result);
  } catch (error) {
    console.error('Error querying transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refund transaction
exports.refundTransaction = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    // Get booking
    const booking = await bookingModel.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Booking is not paid' });
    }

    // Get transaction date
    const transactionDate = new Date(booking.created_at)
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);

    // Refund via VNPay
    const result = await vnpay.refundTransaction(
      bookingId,
      transactionDate,
      booking.total_amount,
      '03', // Full refund
      req.user.email || 'user'
    );

    // Update booking status
    if (result.vnp_ResponseCode === '00') {
      await bookingModel.updatePaymentStatus(bookingId, 'refunded');
      res.json({
        success: true,
        message: 'Refund successful',
        result
      });
    } else {
      res.json({
        success: false,
        message: 'Refund failed',
        result
      });
    }
  } catch (error) {
    console.error('Error refunding transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
