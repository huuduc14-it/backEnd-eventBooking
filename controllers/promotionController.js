const promotionModel = require('../models/promotionModel');

// Create promotion (Organizer only)
exports.createPromotion = async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, start_date, end_date, event_id } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ message: 'Code, discount type, and discount value are required' });
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ message: 'Invalid discount type. Must be "percent" or "fixed"' });
    }

    // Check if code already exists
    const existing = await promotionModel.getPromotionByCode(code);
    if (existing) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    const promoId = await promotionModel.createPromotion({
      code,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      event_id
    });

    res.status(201).json({ 
      message: 'Promotion created successfully', 
      promoId 
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all promotions for an event
exports.getPromotionsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const promotions = await promotionModel.getPromotionsByEvent(eventId);

    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all active promotions
exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await promotionModel.getActivePromotions();

    res.json(promotions);
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Validate promotion code
exports.validatePromotion = async (req, res) => {
  try {
    const { code, eventId } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }

    const result = await promotionModel.validatePromotion(code, eventId);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // Calculate potential discount for display
    const { promo } = result;
    res.json({
      valid: true,
      promo: {
        promo_id: promo.promo_id,
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value
      }
    });
  } catch (error) {
    console.error('Error validating promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Apply promotion to booking
exports.applyPromotion = async (req, res) => {
  try {
    const { bookingId, promoCode } = req.body;

    if (!bookingId || !promoCode) {
      return res.status(400).json({ message: 'Booking ID and promo code are required' });
    }

    // Get booking details
    const [[booking]] = await promotionModel.constructor.query(
      'SELECT event_id FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate promotion
    const validation = await promotionModel.validatePromotion(promoCode, booking.event_id);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Apply promotion
    const result = await promotionModel.applyPromotionToBooking(bookingId, validation.promo.promo_id);

    res.json({
      message: 'Promotion applied successfully',
      discount: result.discount,
      newTotal: result.newTotal
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get promotions applied to a booking
exports.getBookingPromotions = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const promotions = await promotionModel.getBookingPromotions(bookingId);

    res.json(promotions);
  } catch (error) {
    console.error('Error fetching booking promotions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
  try {
    const { promoId } = req.params;
    const updates = req.body;

    const promo = await promotionModel.getPromotionByCode(updates.code);
    if (promo && promo.promo_id != promoId) {
      return res.status(400).json({ message: 'Promotion code already exists' });
    }

    await promotionModel.updatePromotion(promoId, updates);

    res.json({ message: 'Promotion updated successfully' });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
  try {
    const { promoId } = req.params;

    await promotionModel.deletePromotion(promoId);

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = exports;
