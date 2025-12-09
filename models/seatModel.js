const db = require('../config/db');

// Create seat map for event
const createSeatMap = async (eventId, mapJson) => {
  const [result] = await db.query(
    'INSERT INTO seat_maps (event_id, map_json) VALUES (?, ?)',
    [eventId, JSON.stringify(mapJson)]
  );
  return result.insertId;
};

// Get seat map for event
const getSeatMapByEvent = async (eventId) => {
  const [rows] = await db.query(
    'SELECT * FROM seat_maps WHERE event_id = ?',
    [eventId]
  );
  if (rows.length > 0 && rows[0].map_json) {
    rows[0].map_json = JSON.parse(rows[0].map_json);
  }
  return rows[0] || null;
};

// Create seats for a seat map
const createSeats = async (seatMapId, seats) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const values = seats.map(seat => [
      seatMapId,
      seat.section,
      seat.row_label,
      seat.seat_number,
      seat.ticket_type_id,
      seat.is_available !== undefined ? seat.is_available : true
    ]);
    
    await connection.query(
      'INSERT INTO seats (seat_map_id, section, row_label, seat_number, ticket_type_id, is_available) VALUES ?',
      [values]
    );
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get all seats for an event
const getSeatsByEvent = async (eventId) => {
  const [rows] = await db.query(
    `SELECT s.*, sm.event_id, tt.name as ticket_type_name, tt.price
     FROM seats s
     JOIN seat_maps sm ON s.seat_map_id = sm.seat_map_id
     LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.ticket_type_id
     WHERE sm.event_id = ?
     ORDER BY s.section, s.row_label, s.seat_number`,
    [eventId]
  );
  return rows;
};

// Get available seats for an event
const getAvailableSeats = async (eventId) => {
  const [rows] = await db.query(
    `SELECT s.*, sm.event_id, tt.name as ticket_type_name, tt.price
     FROM seats s
     JOIN seat_maps sm ON s.seat_map_id = sm.seat_map_id
     LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.ticket_type_id
     WHERE sm.event_id = ? AND s.is_available = TRUE
     ORDER BY s.section, s.row_label, s.seat_number`,
    [eventId]
  );
  return rows;
};

// Reserve seats (mark as unavailable)
const reserveSeats = async (seatIds) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if all seats are available
    const [seats] = await connection.query(
      'SELECT seat_id, is_available FROM seats WHERE seat_id IN (?) FOR UPDATE',
      [seatIds]
    );
    
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      throw new Error('Some seats are no longer available');
    }
    
    // Reserve the seats
    await connection.query(
      'UPDATE seats SET is_available = FALSE WHERE seat_id IN (?)',
      [seatIds]
    );
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Release seats (mark as available)
const releaseSeats = async (seatIds) => {
  await db.query(
    'UPDATE seats SET is_available = TRUE WHERE seat_id IN (?)',
    [seatIds]
  );
  return true;
};

// Get seat by ID
const getSeatById = async (seatId) => {
  const [rows] = await db.query(
    'SELECT * FROM seats WHERE seat_id = ?',
    [seatId]
  );
  return rows[0] || null;
};

// Update seat
const updateSeat = async (seatId, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.section !== undefined) {
    fields.push('section = ?');
    values.push(updates.section);
  }
  if (updates.row_label !== undefined) {
    fields.push('row_label = ?');
    values.push(updates.row_label);
  }
  if (updates.seat_number !== undefined) {
    fields.push('seat_number = ?');
    values.push(updates.seat_number);
  }
  if (updates.ticket_type_id !== undefined) {
    fields.push('ticket_type_id = ?');
    values.push(updates.ticket_type_id);
  }
  if (updates.is_available !== undefined) {
    fields.push('is_available = ?');
    values.push(updates.is_available);
  }
  
  if (fields.length === 0) {
    return false;
  }
  
  values.push(seatId);
  await db.query(
    `UPDATE seats SET ${fields.join(', ')} WHERE seat_id = ?`,
    values
  );
  return true;
};

// Delete seat
const deleteSeat = async (seatId) => {
  await db.query('DELETE FROM seats WHERE seat_id = ?', [seatId]);
  return true;
};

module.exports = {
  createSeatMap,
  getSeatMapByEvent,
  createSeats,
  getSeatsByEvent,
  getAvailableSeats,
  reserveSeats,
  releaseSeats,
  getSeatById,
  updateSeat,
  deleteSeat
};
