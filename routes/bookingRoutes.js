const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/book', authMiddleware, bookingController.bookTickets);
router.post('/verify', authMiddleware, bookingController.verifyTicket);
router.get('/my-tickets', authMiddleware, bookingController.getMyHistory);

module.exports = router;