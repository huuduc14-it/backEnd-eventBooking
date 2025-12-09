const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizerMiddleware = require('../middlewares/organizerMiddleware');

// Public routes - anyone can view seats
router.get('/events/:eventId/seats', seatController.getSeats);
router.get('/events/:eventId/seats/available', seatController.getAvailableSeats);
router.get('/events/:eventId/seat-map', seatController.getSeatMap);

// Protected routes - authenticated users can reserve/release
router.post('/seats/reserve', authMiddleware, seatController.reserveSeats);
router.post('/seats/release', authMiddleware, seatController.releaseSeats);

// Organizer routes - only organizers can manage seats
router.post('/events/:eventId/seat-map', authMiddleware, organizerMiddleware, seatController.createSeatMap);
router.post('/events/:eventId/seats', authMiddleware, organizerMiddleware, seatController.addSeats);
router.put('/seats/:seatId', authMiddleware, organizerMiddleware, seatController.updateSeat);
router.delete('/seats/:seatId', authMiddleware, organizerMiddleware, seatController.deleteSeat);

module.exports = router;
