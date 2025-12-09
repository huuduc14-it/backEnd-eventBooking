const db = require('../config/db');

// Create promotion
const createPromotion = async (promoData) => {
  const { code, description, discount_type, discount_value, start_date, end_date, event_id } = promoData;
  
  const [result] = await db.query(
    `INSERT INTO promotions (code, description, discount_type, discount_value, start_date, end_date, event_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, description, discount_type, discount_value, start_date, end_date, event_id]
  );
  
  return result.insertId;
};

// Get promotion by code
const getPromotionByCode = async (code) => {
  const [rows] = await db.query(
    'SELECT * FROM promotions WHERE code = ?',
    [code]
  );
  return rows[0] || null;
};

// Get all promotions for an event
const getPromotionsByEvent = async (eventId) => {
  const [rows] = await db.query(
    `SELECT * FROM promotions WHERE event_id = ? OR event_id IS NULL
     ORDER BY created_at DESC`,
    [eventId]
  );
  return rows;
};

// Get all active promotions
const getActivePromotions = async () => {
  const [rows] = await db.query(
    `SELECT * FROM promotions 
     WHERE (start_date IS NULL OR start_date <= CURDATE())
     AND (end_date IS NULL OR end_date >= CURDATE())
     ORDER BY created_at DESC`
  );
  return rows;
};

// Validate promotion
const validatePromotion = async (code, eventId) => {
  const promo = await getPromotionByCode(code);
  
  if (!promo) {
    return { valid: false, message: 'Mã khuyến mãi không tồn tại' };
  }
  
  // Check if event-specific promo matches the event
  if (promo.event_id && promo.event_id != eventId) {
    return { valid: false, message: 'Mã khuyến mãi không áp dụng cho sự kiện này' };
  }
  
  // Check start date
  if (promo.start_date) {
    const startDate = new Date(promo.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate > today) {
      return { valid: false, message: 'Mã khuyến mãi chưa có hiệu lực' };
    }
  }
  
  // Check end date
  if (promo.end_date) {
    const endDate = new Date(promo.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) {
      return { valid: false, message: 'Mã khuyến mãi đã hết hạn' };
    }
  }
  
  return { valid: true, promo };
};

// Calculate discount
const calculateDiscount = (totalAmount, promo) => {
  if (promo.discount_type === 'percent') {
    return totalAmount * (promo.discount_value / 100);
  } else if (promo.discount_type === 'fixed') {
    return Math.min(promo.discount_value, totalAmount);
  }
  return 0;
};

// Apply promotion to booking
const applyPromotionToBooking = async (bookingId, promoId) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if promotion already applied
    const [existing] = await connection.query(
      'SELECT * FROM booking_promotions WHERE booking_id = ? AND promo_id = ?',
      [bookingId, promoId]
    );
    
    if (existing.length > 0) {
      throw new Error('Promotion already applied to this booking');
    }
    
    // Add promotion to booking
    await connection.query(
      'INSERT INTO booking_promotions (booking_id, promo_id) VALUES (?, ?)',
      [bookingId, promoId]
    );
    
    // Get booking and promotion details
    const [[booking]] = await connection.query(
      'SELECT total_amount FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    
    const [[promo]] = await connection.query(
      'SELECT * FROM promotions WHERE promo_id = ?',
      [promoId]
    );
    
    // Calculate discount
    const discount = calculateDiscount(booking.total_amount, promo);
    const newTotal = booking.total_amount - discount;
    
    // Update booking total
    await connection.query(
      'UPDATE bookings SET total_amount = ? WHERE booking_id = ?',
      [newTotal, bookingId]
    );
    
    await connection.commit();
    return { discount, newTotal };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get promotions applied to booking
const getBookingPromotions = async (bookingId) => {
  const [rows] = await db.query(
    `SELECT p.* FROM promotions p
     JOIN booking_promotions bp ON p.promo_id = bp.promo_id
     WHERE bp.booking_id = ?`,
    [bookingId]
  );
  return rows;
};

// Update promotion
const updatePromotion = async (promoId, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.code !== undefined) {
    fields.push('code = ?');
    values.push(updates.code);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.discount_type !== undefined) {
    fields.push('discount_type = ?');
    values.push(updates.discount_type);
  }
  if (updates.discount_value !== undefined) {
    fields.push('discount_value = ?');
    values.push(updates.discount_value);
  }
  if (updates.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.start_date);
  }
  if (updates.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.end_date);
  }
  
  if (fields.length === 0) {
    return false;
  }
  
  values.push(promoId);
  await db.query(
    `UPDATE promotions SET ${fields.join(', ')} WHERE promo_id = ?`,
    values
  );
  return true;
};

// Delete promotion
const deletePromotion = async (promoId) => {
  // Check if promotion is used in any bookings
  const [bookings] = await db.query(
    'SELECT COUNT(*) as count FROM booking_promotions WHERE promo_id = ?',
    [promoId]
  );
  
  if (bookings[0].count > 0) {
    throw new Error('Cannot delete promotion that has been used');
  }
  
  await db.query('DELETE FROM promotions WHERE promo_id = ?', [promoId]);
  return true;
};

module.exports = {
  createPromotion,
  getPromotionByCode,
  getPromotionsByEvent,
  getActivePromotions,
  validatePromotion,
  calculateDiscount,
  applyPromotionToBooking,
  getBookingPromotions,
  updatePromotion,
  deletePromotion
};
