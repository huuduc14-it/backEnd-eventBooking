const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizerMiddleware = require('../middlewares/organizerMiddleware');

// Public routes
router.get('/promotions/active', promotionController.getActivePromotions);
router.get('/events/:eventId/promotions', promotionController.getPromotionsByEvent);
router.post('/promotions/validate', promotionController.validatePromotion);

// Protected routes - authenticated users
router.post('/bookings/apply-promotion', authMiddleware, promotionController.applyPromotion);
router.get('/bookings/:bookingId/promotions', authMiddleware, promotionController.getBookingPromotions);

// Organizer routes - only organizers can manage promotions
router.post('/promotions', authMiddleware, organizerMiddleware, promotionController.createPromotion);
router.put('/promotions/:promoId', authMiddleware, organizerMiddleware, promotionController.updatePromotion);
router.delete('/promotions/:promoId', authMiddleware, organizerMiddleware, promotionController.deletePromotion);

module.exports = router;
