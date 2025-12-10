const db = require("../config/db");
const { v4: uuidv4 } = require("uuid"); // Run: npm install uuid

class BookingModel {
  // static async createBooking(userId, eventId, items) {
  //   const conn = db.promise(); // Get dedicated connection
  //   try {
  //     await conn.beginTransaction(); // START TRANSACTION
  //     let totalAmount = 0;
  //     // --- STEP 1: CALCULATE TOTAL & CHECK STOCK ---
  //     for (const item of items) {
  //       // Lock the row (FOR UPDATE) so no one else can buy this specific ticket type while we check
  //       const [rows] = await conn.execute(
  //         "SELECT price, remaining FROM ticket_types WHERE ticket_type_id = ? FOR UPDATE",
  //         [item.ticket_type_id]
  //       );
  //       if (rows.length === 0) throw new Error("Invalid Ticket Type");
  //       const ticketInfo = rows[0];
  //       if (ticketInfo.remaining < item.quantity) {
  //         throw new Error(
  //           `Not enough tickets! Only ${ticketInfo.remaining} left.`
  //         );
  //       }
  //       totalAmount += Number(ticketInfo.price) * item.quantity;
  //     }
  //     // --- STEP 2: CREATE BOOKING RECORD ---
  //     const [bookingRes] = await conn.execute(
  //       `INSERT INTO bookings (user_id, event_id, total_amount, payment_status) VALUES (?, ?, ?, 'paid')`,
  //       [userId, eventId, totalAmount]
  //     );
  //     const bookingId = bookingRes.insertId;
  //     // --- STEP 3: CREATE ITEMS & TICKETS ---
  //     for (const item of items) {
  //       // A. Insert Booking Item
  //       const [itemRes] = await conn.execute(
  //         `INSERT INTO booking_items (booking_id, ticket_type_id, price)
  //          SELECT ?, ?, price FROM ticket_types WHERE ticket_type_id = ?`,
  //         [bookingId, item.ticket_type_id, item.ticket_type_id]
  //       );
  //       const itemId = itemRes.insertId;
  //       // B. Generate Individual QR Codes (1 row per physical ticket)
  //       for (let i = 0; i < item.quantity; i++) {
  //         const qrCode = `${eventId}-${item.ticket_type_id}-${uuidv4()}`; // Unique String
  //         await conn.execute(
  //           `INSERT INTO tickets (booking_item, qr_code) VALUES (?, ?)`,
  //           [itemId, qrCode]
  //         );
  //       }
  //       // C. Deduct Stock
  //       await conn.execute(
  //         `UPDATE ticket_types SET remaining = remaining - ? WHERE ticket_type_id = ?`,
  //         [item.quantity, item.ticket_type_id]
  //       );
  //     }
  //     await conn.commit(); // SAVE EVERYTHING
  //     return { bookingId, totalAmount };
  //   } catch (err) {
  //     await conn.rollback(); // UNDO EVERYTHING IF ERROR
  //     throw err;
  //   }
  // }
  // static async verifyTicket(qrCode) {
  //   const conn = db.promise(); // or await db.promise().getConnection() if using pool transaction
  //   // 1. Find Ticket
  //   const [rows] = await conn.execute(
  //     `SELECT t.ticket_id, t.is_used, e.title as event_title, tt.name as ticket_name
  //        FROM tickets t
  //        JOIN booking_items bi ON t.booking_item = bi.item_id
  //        JOIN bookings b ON bi.booking_id = b.booking_id
  //        JOIN events e ON b.event_id = e.event_id
  //        JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
  //        WHERE t.qr_code = ?`,
  //     [qrCode]
  //   );
  //   if (rows.length === 0) {
  //     return { status: "INVALID", message: "Ticket not found" };
  //   }
  //   const ticket = rows[0];
  //   // 2. Check if already used
  //   if (ticket.is_used) {
  //     return {
  //       status: "ALREADY_USED",
  //       message: `Ticket already checked in! (${ticket.ticket_name})`,
  //       data: ticket,
  //     };
  //   }
  //   // 3. Mark as Used
  //   await conn.execute(
  //     "UPDATE tickets SET is_used = TRUE WHERE ticket_id = ?",
  //     [ticket.ticket_id]
  //   );
  //   return {
  //     status: "SUCCESS",
  //     message: "Check-in Successful",
  //     data: ticket,
  //   };
  // }
  // static async getMyTickets(userId) {
  //   const db = require("../config/db"); // Use your DB pool
  //   const conn = db.promise();
  //   // We select individual tickets so each row has 1 QR Code
  //   const sql = `
  //       SELECT
  //           b.booking_id,
  //           e.title AS event_title,
  //           DATE_FORMAT(e.start_time, '%Y-%m-%d %H:%i') AS start_time,
  //           e.location_name,
  //           tt.name AS ticket_name,
  //           bi.price AS total_amount,
  //           t.qr_code,
  //           1 AS quantity,
  //           t.is_used
  //       FROM tickets t
  //       JOIN booking_items bi ON t.booking_item = bi.item_id
  //       JOIN bookings b ON bi.booking_id = b.booking_id
  //       JOIN events e ON b.event_id = e.event_id
  //       JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
  //       WHERE b.user_id = ?
  //       ORDER BY b.created_at DESC
  //   `;
  //   const [rows] = await conn.execute(sql, [userId]);
  //   return rows;
  // }
  static async createBooking(userId, eventId, items) {
    const conn = await db.getConnection(); // lấy connection riêng cho transaction
    try {
      await conn.beginTransaction();

      let totalAmount = 0;

      // STEP 1: CHECK STOCK & CALCULATE TOTAL
      for (const item of items) {
        const [rows] = await conn.execute(
          "SELECT price, remaining FROM ticket_types WHERE ticket_type_id = ? FOR UPDATE",
          [item.ticket_type_id]
        );

        if (rows.length === 0) throw new Error("Invalid Ticket Type");
        const ticketInfo = rows[0];

        if (ticketInfo.remaining < item.quantity) {
          throw new Error(
            `Not enough tickets! Only ${ticketInfo.remaining} left.`
          );
        }

        totalAmount += Number(ticketInfo.price) * item.quantity;
      }

      // STEP 2: CREATE BOOKING RECORD
      const [bookingRes] = await conn.execute(
        `INSERT INTO bookings (user_id, event_id, total_amount, payment_status) VALUES (?, ?, ?, 'paid')`,
        [userId, eventId, totalAmount]
      );
      const bookingId = bookingRes.insertId;

      // STEP 3: CREATE ITEMS & TICKETS
      for (const item of items) {
        // A. Insert Booking Item
        const [itemRes] = await conn.execute(
          `INSERT INTO booking_items (booking_id, ticket_type_id, price) 
           SELECT ?, ?, price FROM ticket_types WHERE ticket_type_id = ?`,
          [bookingId, item.ticket_type_id, item.ticket_type_id]
        );
        const itemId = itemRes.insertId;

        // B. Generate individual QR Codes
        for (let i = 0; i < item.quantity; i++) {
          const qrCode = `${eventId}-${item.ticket_type_id}-${uuidv4()}`;
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

      await conn.commit();
      conn.release(); // release connection về pool
      return { bookingId, totalAmount };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  // --- VERIFY TICKET ---
  static async verifyTicket(qrCode) {
    // Không cần transaction, dùng trực tiếp pool
    const sql = `
      SELECT t.ticket_id, t.is_used, e.title AS event_title, tt.name AS ticket_name
      FROM tickets t
      JOIN booking_items bi ON t.booking_item = bi.item_id
      JOIN bookings b ON bi.booking_id = b.booking_id
      JOIN events e ON b.event_id = e.event_id
      JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
      WHERE t.qr_code = ?
    `;

    const [rows] = await db.execute(sql, [qrCode]);
    if (rows.length === 0) {
      return { status: "INVALID", message: "Ticket not found" };
    }

    const ticket = rows[0];

    if (ticket.is_used) {
      return {
        status: "ALREADY_USED",
        message: `Ticket already checked in! (${ticket.ticket_name})`,
        data: ticket,
      };
    }

    // Mark as used
    await db.execute("UPDATE tickets SET is_used = TRUE WHERE ticket_id = ?", [
      ticket.ticket_id,
    ]);

    return { status: "SUCCESS", message: "Check-in Successful", data: ticket };
  }

  // --- GET MY TICKETS ---
  // static async getMyTickets(userId) {
  //   const sql = `
  //     SELECT
  //       b.booking_id,
  //       e.title AS event_title,
  //       DATE_FORMAT(e.start_time, '%Y-%m-%d %H:%i') AS start_time,
  //       e.location_name,
  //       tt.name AS ticket_name,
  //       bi.price AS total_amount,
  //       t.qr_code,
  //       1 AS quantity,
  //       t.is_used
  //     FROM tickets t
  //     JOIN booking_items bi ON t.booking_item = bi.item_id
  //     JOIN bookings b ON bi.booking_id = b.booking_id
  //     JOIN events e ON b.event_id = e.event_id
  //     JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
  //     WHERE b.user_id = ?
  //     ORDER BY b.created_at DESC
  //   `;

  //   const [rows] = await db.execute(sql, [userId]);
  //   return rows;
  // }
  static async getMyTickets(userId) {
    const sql = `
    SELECT 
      b.booking_id,
      e.title AS event_title,
      DATE_FORMAT(e.start_time, '%Y-%m-%d %H:%i') AS start_time,
      e.location_name,
      tt.name AS ticket_name,
      bi.price AS total_amount,
      COUNT(t.ticket_id) AS quantity,
      SUM(t.is_used) AS used_count
    FROM tickets t
    JOIN booking_items bi ON t.booking_item = bi.item_id
    JOIN bookings b ON bi.booking_id = b.booking_id
    JOIN events e ON b.event_id = e.event_id
    JOIN ticket_types tt ON bi.ticket_type_id = tt.ticket_type_id
    WHERE b.user_id = ?
    GROUP BY b.booking_id, bi.item_id
    ORDER BY b.created_at DESC
  `;

    const [rows] = await db.execute(sql, [userId]);
    return rows;
  }
}

module.exports = BookingModel;
