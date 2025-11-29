const db = require("../config/db");
const { v4: uuidv4 } = require('uuid'); // Run: npm install uuid

class BookingModel {
  static async createBooking(userId, eventId, items) {
    const conn = db.promise() // Get dedicated connection
    try {
      await conn.beginTransaction(); // START TRANSACTION

      let totalAmount = 0;

      // --- STEP 1: CALCULATE TOTAL & CHECK STOCK ---
      for (const item of items) {
        // Lock the row (FOR UPDATE) so no one else can buy this specific ticket type while we check
        const [rows] = await conn.execute(
          'SELECT price, remaining FROM ticket_types WHERE ticket_type_id = ? FOR UPDATE', 
          [item.ticket_type_id]
        );

        if (rows.length === 0) throw new Error("Invalid Ticket Type");
        const ticketInfo = rows[0];

        if (ticketInfo.remaining < item.quantity) {
          throw new Error(`Not enough tickets! Only ${ticketInfo.remaining} left.`);
        }

        totalAmount += Number(ticketInfo.price) * item.quantity;
      }

      // --- STEP 2: CREATE BOOKING RECORD ---
      const [bookingRes] = await conn.execute(
        `INSERT INTO bookings (user_id, event_id, total_amount, payment_status) VALUES (?, ?, ?, 'paid')`,
        [userId, eventId, totalAmount]
      );
      const bookingId = bookingRes.insertId;

      // --- STEP 3: CREATE ITEMS & TICKETS ---
      for (const item of items) {
        // A. Insert Booking Item
        const [itemRes] = await conn.execute(
          `INSERT INTO booking_items (booking_id, ticket_type_id, price) 
           SELECT ?, ?, price FROM ticket_types WHERE ticket_type_id = ?`,
          [bookingId, item.ticket_type_id, item.ticket_type_id]
        );
        const itemId = itemRes.insertId;

        // B. Generate Individual QR Codes (1 row per physical ticket)
        for (let i = 0; i < item.quantity; i++) {
          const qrCode = `${eventId}-${item.ticket_type_id}-${uuidv4()}`; // Unique String
          await conn.execute(
            `INSERT INTO tickets (booking_item, qr_code) VALUES (?, ?)`,
            [itemId, qrCode]
          );
        }

        // C. Deduct Stock
        await conn.execute(
          `UPDATE ticket_types SET remaining = remaining - ? WHERE ticket_type_id = ?`,
          [item.quantity, item.ticket_type_id]
        );
      }

      await conn.commit(); // SAVE EVERYTHING
     
      return { bookingId, totalAmount };

    } catch (err) {
      await conn.rollback(); // UNDO EVERYTHING IF ERROR
      throw err;
    }
  }
}

module.exports = BookingModel;